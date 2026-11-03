import { useEffect, useRef } from 'react';

/**
 * useMobileBackNavigation
 * 
 * Provides native mobile back gesture & back button handling for the single-page application:
 * 1. Closes any open modal/drawer (Profile, Task Detail, Create Task, Notifications, etc.)
 *    instead of exiting or closing the website.
 * 2. Emits an 'app:mobileback' custom event so sub-panes (like ChatView's active chat conversation)
 *    can intercept and return to roster.
 * 3. Navigates backward through views (e.g. from Chat -> Dashboard) instead of exiting.
 */
export function useMobileBackNavigation({
  activeView,
  setActiveView,
  viewingUserProfile,
  setViewingUserProfile,
  selectedTaskId,
  setSelectedTaskId,
  isCreateModalOpen,
  setIsCreateModalOpen,
  editingTask,
  setEditingTask,
  isNotificationsOpen,
  setIsNotificationsOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isRegisterModalOpen,
  setIsRegisterModalOpen,
}) {
  const isPoppingRef = useRef(false);
  const activeModalRef = useRef(null);

  // Determine currently active modal/drawer name
  const currentModal = viewingUserProfile
    ? 'userProfile'
    : selectedTaskId
    ? 'taskDetail'
    : (isCreateModalOpen || editingTask)
    ? 'taskForm'
    : isNotificationsOpen
    ? 'notifications'
    : isMobileMenuOpen
    ? 'mobileMenu'
    : isRegisterModalOpen
    ? 'register'
    : null;

  // Handle Modal History State Push & Pop
  useEffect(() => {
    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      activeModalRef.current = currentModal;
      return;
    }

    if (currentModal && currentModal !== activeModalRef.current) {
      // A modal opened! Push history state so phone back button closes it
      window.history.pushState({ type: 'modal', name: currentModal }, '', window.location.hash || '#');
      activeModalRef.current = currentModal;
    } else if (!currentModal && activeModalRef.current) {
      // Modal closed via UI (e.g. clicking "X" or backdrop)
      // Pop the state if our modal state is still at top of history
      if (window.history.state?.type === 'modal') {
        isPoppingRef.current = true;
        window.history.back();
      }
      activeModalRef.current = null;
    }
  }, [currentModal]);

  // Handle View History State
  const prevViewRef = useRef(activeView);
  useEffect(() => {
    // Sync initial state if needed
    if (!window.history.state) {
      window.history.replaceState({ type: 'view', view: activeView }, '', `#${activeView}`);
      prevViewRef.current = activeView;
      return;
    }

    if (isPoppingRef.current) {
      prevViewRef.current = activeView;
      return;
    }

    if (activeView !== prevViewRef.current) {
      window.history.pushState({ type: 'view', view: activeView }, '', `#${activeView}`);
      prevViewRef.current = activeView;
    }
  }, [activeView]);

  // Global PopState Listener
  useEffect(() => {
    const handlePopState = (e) => {
      // 1. If any modal is open, close it and prevent leaving view
      if (activeModalRef.current) {
        isPoppingRef.current = true;
        if (viewingUserProfile && setViewingUserProfile) setViewingUserProfile(null);
        if (selectedTaskId && setSelectedTaskId) setSelectedTaskId(null);
        if (isCreateModalOpen && setIsCreateModalOpen) setIsCreateModalOpen(false);
        if (editingTask && setEditingTask) setEditingTask(null);
        if (isNotificationsOpen && setIsNotificationsOpen) setIsNotificationsOpen(false);
        if (isMobileMenuOpen && setIsMobileMenuOpen) setIsMobileMenuOpen(false);
        if (isRegisterModalOpen && setIsRegisterModalOpen) setIsRegisterModalOpen(false);
        activeModalRef.current = null;
        return;
      }

      // 2. If a custom back handler was registered (e.g. ChatView activePane === 'chat')
      const backEvent = new CustomEvent('app:mobileback', { cancelable: true });
      const wasNotPrevented = window.dispatchEvent(backEvent);
      // If event was defaultPrevented by a subcomponent, stop here!
      if (!wasNotPrevented || backEvent.defaultPrevented) {
        return;
      }

      // 3. Otherwise handle view navigation
      if (e.state?.view && e.state.view !== activeView && setActiveView) {
        isPoppingRef.current = true;
        setActiveView(e.state.view);
        prevViewRef.current = e.state.view;
      } else {
        // If back was pressed and we have no state, return to dashboard if not on dashboard
        const hash = window.location.hash.replace('#', '');
        if (hash && hash !== activeView && setActiveView) {
          isPoppingRef.current = true;
          setActiveView(hash);
        } else if (activeView !== 'dashboard' && setActiveView) {
          isPoppingRef.current = true;
          setActiveView('dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    activeView,
    setActiveView,
    viewingUserProfile,
    setViewingUserProfile,
    selectedTaskId,
    setSelectedTaskId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingTask,
    setEditingTask,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isRegisterModalOpen,
    setIsRegisterModalOpen
  ]);
}
