/**
 * Production Tracking Data Extractor & Markdown Parser
 * Extracts structured lot tracking data from:
 * 1. msg.trackingData
 * 2. msg.fileAttachment.trackingData
 * 3. Text fallback (Markdown table or Numbered Department Audit Trail)
 */

export function extractTrackingData(msg) {
  if (!msg) return null;

  // 1. Direct object on message
  if (msg.trackingData && Array.isArray(msg.trackingData.stages) && msg.trackingData.stages.length > 0) {
    return normalizeTrackingData(msg.trackingData);
  }

  // 2. Encapsulated in fileAttachment
  if (msg.fileAttachment) {
    try {
      const att = typeof msg.fileAttachment === 'string'
        ? JSON.parse(msg.fileAttachment)
        : msg.fileAttachment;

      if (att && att.trackingData && Array.isArray(att.trackingData.stages)) {
        return normalizeTrackingData(att.trackingData);
      }
    } catch (e) {
      // not json
    }
  }

  // 3. Fallback: Parse from msg.text
  if (typeof msg.text === 'string' && msg.text.length > 30) {
    const parsed = parseTrackingDataFromText(msg.text);
    if (parsed) {
      return normalizeTrackingData(parsed);
    }
  }

  return null;
}

/**
 * Normalizes stages with standard flags (isCompleted, isWip, isPending)
 */
function normalizeTrackingData(data) {
  if (!data) return null;

  const isCancelled = Boolean(
    data.isCancelled ||
    /cancel/i.test(data.cancelReason || '') ||
    /cancel/i.test(data.currentStage || '')
  );

  const stages = (data.stages || [])
    .filter(st => {
      const name = `${st.dept || ''} ${st.stageName || ''} ${st.shortName || ''}`.toLowerCase();
      return !name.includes('zip') && !name.includes('dori');
    })
    .map(st => {
      const isPacking = /packing|barcode/i.test(st.dept || '') || /packing|barcode/i.test(st.stageName || '');
      const hasBarcode = Boolean(
        (st.notes && /barcodes?:\s*[A-Za-z0-9_-]+/i.test(st.notes)) ||
        (st.status && /barcode/i.test(st.status)) ||
        Boolean(st.barcodeId || (Array.isArray(st.barcodes) && st.barcodes.length > 0))
      );

      // FACTORY BUSINESS RULE: IF BARCODE IS PRINTED, PACKING IS ALSO COMPLETED!
      const isCompleted = (isPacking && hasBarcode) || (
        st.isCompleted !== undefined
          ? Boolean(st.isCompleted)
          : Boolean(st.status && (st.status.includes('✓') || /completed|complete|packed|order registered/i.test(st.status)))
      );

      const isWip = !isCompleted && (
        st.isWip !== undefined
          ? Boolean(st.isWip)
          : Boolean(st.status && (/wip|in progress|ongoing/i.test(st.status) || st.latestWipRemarks))
      );

      const isPending = !isCompleted && !isWip;

      let status = st.status || '';
      if (isPacking && hasBarcode && !status.includes('✓')) {
        const bText = (st.notes && st.notes.match(/barcodes?:\s*([A-Za-z0-9_-]+)/i))?.[1] || '';
        status = bText ? `✓ Packed (Barcode: ${bText})` : '✓ Packed (Barcode Printed)';
      }

      return {
        ...st,
        status,
        isCompleted,
        isWip,
        isPending
      };
    });

  // Calculate overallProgress and currentStage (If packing has barcode/complete -> 100% Production Completed)
  const isPackingDone = stages.some(s => (/packing|barcode/i.test(s.dept || '') || /packing|barcode/i.test(s.stageName || '')) && s.isCompleted);
  let progress = Number(data.overallProgress);
  let currentStage = data.currentStage || 'In Production';

  if (isCancelled) {
    progress = 0;
    currentStage = 'Order Cancelled';
  } else if (isPackingDone) {
    progress = 100;
    currentStage = 'Production Completed';
  } else if (isNaN(progress) || progress <= 0) {
    const total = stages.length || 1;
    const completedCount = stages.filter(s => s.isCompleted).length;
    const wipCount = stages.filter(s => s.isWip).length;
    progress = Math.min(100, Math.round(((completedCount + (wipCount * 0.5)) / total) * 100));
  }

  return {
    ...data,
    isCancelled,
    overallProgress: progress,
    currentStage,
    stages
  };
}

/**
 * Parses markdown table or numbered department trail from raw AI text response
 */
function parseTrackingDataFromText(text) {
  if (!text) return null;

  // Safety check: if text is accessory issuance, issue_logs, accessory stock, or materials storage, NEVER parse as garment production tracking card!
  if (/verified accessory|issue_logs|accessory\s*issue|accessory\s*stock|materials?\s*storage/i.test(text)) {
    return null;
  }

  // Safety check: if text is a multi-lot pipeline report (contains multiple lot listings like "1. Lot...", "2. Lot..."),
  // NEVER parse as a single-lot department tracking card! Multi-lot reports are rendered by PulseBotMessageRenderer.
  const multiLotMatches = text.match(/(?:^|\n)\s*\d+\.\s*Lot\s*[:#-]?\s*\d+/gi);
  if (multiLotMatches && multiLotMatches.length >= 2) {
    return null;
  }
  if (/List of \d+ (?:Pending|Uncut|Completed|Active)?\s*Lots/i.test(text)) {
    return null;
  }

  // Must mention a Lot number and department/production trail
  const hasLot = /(?:lot|lot number|lot no\.?|lot\s*#|#)\s*:?-?\s*([A-Za-z0-9_-]+)/i.test(text);
  const hasTrail = /department|cutting|stitching|packing|process date|audit trail|production journey|job order/i.test(text);

  // Safety check: if text is a specific attribute answer suggesting timeline as a follow-up, do NOT parse as tracking card
  if (/next suggested (?:question|action)|agla sawaal/i.test(text)) {
    return null;
  }

  if (!hasLot || !hasTrail) {
    return null;
  }

  const lotMatch = text.match(/(?:lot|lot number|lot no\.?|lot\s*#|#)\s*:?-?\s*([A-Za-z0-9_-]+)/i);
  const lotNumber = lotMatch ? lotMatch[1] : '';

  // Extract metadata
  const joMatch = text.match(/job order(?:\s*no\.?)?\s*:?\s*[`*]?([A-Za-z0-9-_]+)[`*]?/i);
  const jobOrderNo = joMatch ? joMatch[1] : '';

  const partyMatch = text.match(/party(?:\s*name)?\s*:?\s*[*`]?([A-Za-z0-9\s&.-]+?)[*`]?\s*(?:[(•\n]|$)/i);
  const party = partyMatch ? partyMatch[1].replace(/[*`_]/g, '').trim() : 'Standard';

  const garmentMatch = text.match(/(?:garment|item)(?:\s*(?:&|type))?\s*:?\s*[*`]?([A-Za-z0-9\s&.-]+?)[*`]?\s*(?:[(•\n]|$)/i);
  const garment = garmentMatch ? garmentMatch[1].replace(/[*`_]/g, '').trim() : 'Garment';

  const styleMatch = text.match(/style\s*:?\s*[*`]?([A-Za-z0-9\s&./()-]+?)[*`]?\s*(?:[(•\n|]|$)/i);
  const style = styleMatch ? styleMatch[1].replace(/[*`_]/g, '').trim() : '';

  const fabricMatch = text.match(/fabric\s*:?\s*[*`]?([A-Za-z0-9\s&.-]+?)[*`]?\s*(?:[(•\n|]|$)/i);
  const fabric = fabricMatch ? fabricMatch[1].replace(/[*`_]/g, '').trim() : '';

  const isCancelled = /order cancelled|officially cancel|cancelled\s*\(/i.test(text);
  const cancelReasonMatch = text.match(/reason:\s*([^)\n]+)/i);
  const cancelReason = cancelReasonMatch ? cancelReasonMatch[1].trim() : (isCancelled ? 'Order Cancelled' : '');

  // Extract Stitching WIP Remarks
  const wipMatch = text.match(/(?:latest\s*(?:stitching\s*)?remarks|latest\s*wip\s*remarks|floor\s*remarks)\s*:?\s*["*`]?([^"\n*`]+)["*`]?/i);
  const latestWipRemark = wipMatch ? wipMatch[1].trim() : null;

  const wipTimeMatch = text.match(/(?:recorded|logged|timestamp):\s*([^)\n]+)/i);
  const latestWipTimestamp = wipTimeMatch ? wipTimeMatch[1].trim() : null;

  // Extract image
  const imgMatch = text.match(/!\[.*?\]\((https?:\/\/[^\s)]+|\/api\/[^\s)]+)\)/);
  const designImageUrl = imgMatch ? imgMatch[1] : null;

  const stages = [];

  // Format A: Markdown Table
  // | Department / Process | Date | Supervisor | Pcs / Qty | Status | Notes |
  const tableRegex = /\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|/g;
  let rowMatch;
  let isHeaderSkipped = false;

  while ((rowMatch = tableRegex.exec(text)) !== null) {
    const col1 = rowMatch[1].replace(/[*`_]/g, '').trim();
    if (!isHeaderSkipped) {
      if (/department|process/i.test(col1)) {
        isHeaderSkipped = true;
        continue;
      }
    }
    if (/^[-:\s]+$/.test(col1)) continue;

    const dept = col1;
    const date = rowMatch[2].replace(/[*`_]/g, '').trim();
    const supervisor = rowMatch[3].replace(/[*`_]/g, '').trim();
    const pcs = rowMatch[4].replace(/[*`_]/g, '').trim();
    const status = rowMatch[5].replace(/[*`_]/g, '').trim();
    const notes = rowMatch[6].replace(/[*`_]/g, '').trim();

    if (dept && status) {
      const name = dept.toLowerCase();
      if (!name.includes('zip') && !name.includes('dori') && !name.includes('trim')) {
        stages.push({ dept, date, supervisor, pcs, status, notes });
      }
    }
  }

  // Format B: Numbered Department Audit Trail
  // e.g. #### 1. Job Order Master or 1. Job Order Master
  // - Process Date: 2026-01-31
  // - Supervisor: ankita
  // - Quantity: 30 SETS
  // - Status: Order Registered
  // - Details: ...
  if (stages.length === 0) {
    const numberedRegex = /(?:^|\n)\s*(?:#{1,6}\s*)?(\d+)\.\s*([^\n:]+)([\s\S]*?)(?=(?:\n\s*(?:#{1,6}\s*)?\d+\.|\n\n#{1,4}\s+[A-Za-z]|$))/g;
    let numMatch;

    while ((numMatch = numberedRegex.exec(text)) !== null) {
      const dept = numMatch[2].replace(/[*`_#]/g, '').trim();
      // If item starts with "Lot", it's a lot listing, not a department stage!
      if (/^lot\s*\d+/i.test(dept)) {
        return null;
      }
      const body = numMatch[3] || '';

      const dMatch = body.match(/[-*•]?\s*(?:process\s*date|date)\s*:\s*([^\n]+)/i);
      const sMatch = body.match(/[-*•]?\s*supervisor\s*:\s*([^\n]+)/i);
      const qMatch = body.match(/[-*•]?\s*(?:quantity|pcs|qty)\s*:\s*([^\n]+)/i);
      const stMatch = body.match(/[-*•]?\s*status\s*:\s*([^\n]+)/i);
      const dtMatch = body.match(/[-*•]?\s*(?:details|notes|remarks|barcodes?)\s*:\s*([^\n]+)/i);

      if (dept) {
        const name = dept.toLowerCase();
        if (!name.includes('zip') && !name.includes('dori') && !name.includes('trim')) {
          stages.push({
            dept,
            date: dMatch ? dMatch[1].replace(/[*`_]/g, '').trim() : '-',
            supervisor: sMatch ? sMatch[1].replace(/[*`_]/g, '').trim() : '-',
            pcs: qMatch ? qMatch[1].replace(/[*`_]/g, '').trim() : '-',
            status: stMatch ? stMatch[1].replace(/[*`_]/g, '').trim() : 'Logged',
            notes: dtMatch ? dtMatch[1].replace(/[*`_]/g, '').trim() : ''
          });
        }
      }
    }
  }

  if (stages.length === 0) {
    return null;
  }

  // Find stitching supervisor if available
  const stitchStage = stages.find(s => /stitching/i.test(s.dept));
  const stitchingSupervisor = stitchStage ? stitchStage.supervisor : null;

  return {
    lotNumber,
    jobOrderNo,
    party,
    garment,
    style,
    fabric,
    designImageUrl,
    isCancelled,
    cancelReason,
    latestWipRemark,
    latestWipTimestamp,
    stitchingSupervisor,
    stages
  };
}

/**
 * Splits message text into conversational intro and closing notes,
 * suppressing the redundant plain-text table/list when the card is shown.
 */
export function splitMessageIntroAndNotes(text, trackingData) {
  if (!text || !trackingData) {
    return { introText: text || '', notesText: '' };
  }

  // Look for the start of the overview or audit trail
  const splitPatterns = [
    /(?:^|\n)(?:###?\s*📦?\s*Lot|Lot\s*[A-Za-z0-9_-]+:\s*Production Overview)/i,
    /(?:^|\n)(?:Department Audit Trail|####?\s*📊?\s*Department-by-Department)/i,
    /(?:^|\n)\|\s*Department\s*\/\s*Process\s*\|/i,
    /(?:^|\n)\s*(?:#{1,6}\s*)?[1-9]\.\s*(?:Job Order Master|Cutting|Stitching|Packing|Production)/i,
    /(?:^|\n)\s*(?:#{1,6}\s*)?[1-9]\.\s*[A-Za-z\s]+Department/i
  ];

  let splitIndex = -1;
  for (const pat of splitPatterns) {
    const match = text.match(pat);
    if (match && match.index !== undefined) {
      if (splitIndex === -1 || match.index < splitIndex) {
        splitIndex = match.index;
      }
    }
  }

  if (splitIndex === -1) {
    return { introText: text, notesText: '' };
  }

  const introText = text.slice(0, splitIndex).trim();

  // Look for any closing footnotes at the end (e.g. *All process dates... or 📄 Job Order...)
  let notesText = '';
  const footnoteMatch = text.match(/(?:\n\n|\n)(\*[^*]+\*|\📄[^\n]+)\s*$/);
  if (footnoteMatch) {
    notesText = footnoteMatch[0].trim();
  }

  return { introText, notesText };
}
