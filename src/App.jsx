import React, { useState, useEffect } from 'react';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import DashboardView from './components/dashboard/DashboardView';
import MyTasksView from './components/mytasks/MyTasksView';
import TaskListView from './components/tasks/TaskListView';
import TaskKanbanView from './components/tasks/TaskKanbanView';
import TaskCalendarView from './components/tasks/TaskCalendarView';
import TaskGanttView from './components/tasks/TaskGanttView';
import ApprovalsView from './components/approvals/ApprovalsView';
import TeamsWorkloadView from './components/teams/TeamsWorkloadView';
import AutomationsView from './components/automations/AutomationsView';
import ReportsView from './components/reports/ReportsView';
import SettingsView from './components/settings/SettingsView';
import ManagerPanelView from './components/manager/ManagerPanelView';
import EmployeePanelView from './components/employee/EmployeePanelView';
import ChatView from './components/chat/ChatView';
import ChatFloatingWidget from './components/chat/ChatFloatingWidget';
import UserRegistrationModal from './components/auth/UserRegistrationModal';
import NotificationsDrawer from './components/notifications/NotificationsDrawer';
import TaskFormModal from './components/tasks/TaskFormModal';
import TaskDetailDrawer from './components/tasks/TaskDetailDrawer';
import AuditLogsView from './components/audit/AuditLogsView';
import AuthPage from './components/auth/AuthPage';
import LeaveManagementView from './components/leaves/LeaveManagementView';
import UserProfileModal from './components/profile/UserProfileModal';
import EaDashboardView from './components/ea/EaDashboardView';
import RealtimeToastContainer from './components/common/RealtimeToastContainer';
import MobileBottomNav from './components/common/MobileBottomNav';
import { Monitor } from 'lucide-react';

function MainLayout() {
  const {
    activeView,
    panelMode,
    activeUser,
    selectedTaskId,
    setSelectedTaskId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isRegisterModalOpen,
    setIsRegisterModalOpen,
    editingTask,
    setEditingTask,
    viewingUserProfile,
    setViewingUserProfile,
    setIsMobileMenuOpen,
    deviceMode,
    setDeviceMode,
    isMobileView
  } = useTaskContext();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Automatically close any slide-over drawers when navigating between views
  useEffect(() => {
    setSelectedTaskId(null);
    setViewingUserProfile(null);
    setIsNotificationsOpen(false);
    setIsMobileMenuOpen(false);
  }, [activeView]);

  return (
    <div className={`app-container ${isMobileView ? 'device-mode-mobile' : 'device-mode-web'}`}>
      {/* Sidebar (desktop sidebar or slide-over drawer on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {(!isMobileView || activeView !== 'chat') && (
          <Header onOpenNotifications={() => setIsNotificationsOpen(true)} />
        )}

        <main
          className={`main-viewport-content ${activeView === 'chat' ? 'chat-viewport overflow-hidden' : 'overflow-y-auto'}`}
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflowY: activeView === 'chat' ? 'hidden' : 'auto',
            overflowX: 'hidden',
            height: isMobileView
              ? (activeView === 'chat'
                  ? 'calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))'
                  : 'calc(100dvh - 60px)')
              : 'calc(100dvh - 68px)',
            maxHeight: isMobileView
              ? (activeView === 'chat'
                  ? 'calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))'
                  : 'calc(100dvh - 60px)')
                : 'calc(100dvh - 68px)',
            paddingBottom: (isMobileView && activeView !== 'chat')
              ? 'calc(100px + env(safe-area-inset-bottom, 0px))'
              : 0
          }}
        >
          {activeView === 'dashboard' && (
            (panelMode === 'manager' || activeUser?.role === 'Manager') ? <ManagerPanelView /> :
            (panelMode === 'employee' || activeUser?.role === 'Employee') ? <EmployeePanelView /> :
            (panelMode === 'ea' || activeUser?.role === 'EA') ? <EaDashboardView /> :
            <DashboardView />
          )}
          {activeView === 'eaPanel' && (panelMode === 'ea' || activeUser?.role === 'EA') && <EaDashboardView />}
          {activeView === 'eaPanel' && (panelMode === 'manager' || activeUser?.role === 'Manager') && <ManagerPanelView />}
          {activeView === 'eaPanel' && (panelMode === 'employee' || activeUser?.role === 'Employee') && <EmployeePanelView />}
          {activeView === 'chat' && <ChatView />}
          {activeView === 'managerPanel' && <ManagerPanelView />}
          {activeView === 'employeePanel' && <EmployeePanelView />}
          {activeView === 'mytasks' && <MyTasksView />}
          {activeView === 'alltasks' && <TaskListView />}
          {activeView === 'kanban' && <TaskKanbanView />}
          {activeView === 'calendar' && <TaskCalendarView />}
          {activeView === 'timeline' && <TaskGanttView />}
          {activeView === 'approvals' && <ApprovalsView />}
          {activeView === 'teams' && <TeamsWorkloadView />}
          {activeView === 'leaves' && <LeaveManagementView />}
          {activeView === 'automations' && <AutomationsView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === 'audit' && <AuditLogsView />}
          {activeView === 'settings' && <SettingsView />}

          {/* Guaranteed Safe Clearance Spacer on Mobile (only for scrollable pages, NOT fixed-dock chat) */}
          {isMobileView && activeView !== 'chat' && (
            <div style={{ height: '70px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Active in Mobile View) */}
      {isMobileView && <MobileBottomNav />}

      {/* Floating Messenger Widget (hidden on mobile or when inside full chat view) */}
      {!isMobileView && activeView !== 'chat' && <ChatFloatingWidget />}

      {/* Global Real-time Event Toasts */}
      <RealtimeToastContainer />

      {/* Slide-over Drawers & Modals */}
      <UserRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {viewingUserProfile && (
        <UserProfileModal
          userId={viewingUserProfile}
          onClose={() => setViewingUserProfile(null)}
        />
      )}

      <TaskFormModal
        isOpen={isCreateModalOpen || !!editingTask}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        taskToEdit={editingTask}
      />

      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useTaskContext();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}
