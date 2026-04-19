// Sidebar is the persistent right panel.
// Contains Settings, Scheduled Jobs and MCP Servers sections.
// Always visible — no overlay, no gear icon needed.
// Each section is independently collapsible.
// Sidebar itself is scrollable when content overflows.

import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import JobsPanel from '../Settings/JobsPanel'
import McpAdminPanel from '../Settings/McpAdminPanel'
import ProviderSettings from '../Settings/ProviderSettings'

// SidebarSection is a collapsible section wrapper
function SidebarSection({ title, defaultOpen = false, children, badge }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {title}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-xs">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

function Sidebar({ onClearChat }) {
  const { settings } = useSettings()

  return (
    <div className="
      w-80 flex-shrink-0
      bg-white border-l border-gray-200
      flex flex-col
      overflow-hidden
    ">

      {/* sidebar header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Control Panel
        </span>
        <button
          onClick={onClearChat}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          title="Clear conversation"
        >
          Clear chat
        </button>
      </div>

      {/* scrollable sections */}
      <div className="flex-1 overflow-y-auto">

        {/* Settings — expanded by default */}
        <SidebarSection title="Settings" defaultOpen={true}>
          <ProviderSettings />
        </SidebarSection>

        {/* Scheduled Jobs */}
        <SidebarSection title="Scheduled Jobs" defaultOpen={false}>
          <JobsPanel inline={true} />
        </SidebarSection>

        {/* MCP Servers */}
        <SidebarSection title="MCP Servers" defaultOpen={false}>
          <McpAdminPanel inline={true} />
        </SidebarSection>

      </div>

    </div>
  )
}

export default Sidebar