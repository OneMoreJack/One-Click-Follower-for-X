
import React, { useState, useEffect, useMemo } from 'react';
import { Account, TaskStats, MessageType } from './types';

declare const chrome: any;

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [stats, setStats] = useState<TaskStats>({ success: 0, skipped: 0, failed: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  const hasChromeApi = typeof chrome !== 'undefined' && !!chrome.runtime?.id;

  const allSelected = useMemo(() => accounts.length > 0 && accounts.every(a => a.selected), [accounts]);
  const selectedCount = useMemo(() => accounts.filter(a => a.selected).length, [accounts]);

  useEffect(() => {
    if (!hasChromeApi) return;

    chrome.storage?.local.get(['taskState'], (result: any) => {
      if (result.taskState) {
        setAccounts(result.taskState.accounts || []);
        setIsProcessing(result.taskState.isProcessing || false);
        setCurrentIndex(result.taskState.currentIndex || -1);
        setStats(result.taskState.stats || { success: 0, skipped: 0, failed: 0, total: 0 });
        setHasScanned(true);
      }
    });

    const listener = (message: any) => {
      if (message.type === MessageType.UPDATE_PROGRESS) {
        setAccounts(message.accounts);
        setCurrentIndex(message.currentIndex);
        setStats(message.stats);
        setIsProcessing(true);
      } else if (message.type === MessageType.TASK_COMPLETE) {
        setIsProcessing(false);
        setStats(message.stats);
        setAccounts(message.accounts);
      } else if (message.type === 'ERROR') {
        setErrorMsg(message.message);
        setIsProcessing(false);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [hasChromeApi]);

  const extractAccountsFromPage = () => {
    if (!hasChromeApi) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        }, (results: any) => {
          setHasScanned(true);
          if (results && results[0]?.result) {
            const extracted: {username: string, avatar: string | null}[] = results[0].result;
            const newAccounts: Account[] = extracted.map(item => ({
              id: Math.random().toString(36).substr(2, 9),
              username: item.username,
              avatar: item.avatar || undefined,
              url: `https://x.com/${item.username}`,
              selected: true,
              status: 'pending'
            }));
            setAccounts(newAccounts);
            setErrorMsg(null);
          } else {
            setAccounts([]);
            setErrorMsg("No accounts found on this page.");
          }
        });
      }
    });
  };

  const toggleAll = () => {
    const newState = !allSelected;
    setAccounts(prev => prev.map(a => ({ ...a, selected: newState })));
  };

  const startTask = () => {
    const selected = accounts.filter(a => a.selected);
    if (selected.length === 0 || !hasChromeApi) return;

    setErrorMsg(null);
    setIsProcessing(true);
    
    chrome.runtime.sendMessage({
      type: MessageType.START_TASK,
      accounts: selected
    });
  };

  const stopTask = () => {
    if (hasChromeApi) {
      chrome.runtime.sendMessage({ type: MessageType.STOP_TASK });
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-[550px] w-[400px] bg-white text-[#0f1419] font-sans">
      <header className="bg-white/90 backdrop-blur-md border-b border-[#eff3f4] px-4 py-3 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">Follower Pro</h1>
        </div>
        {hasScanned && (
          <button 
            onClick={extractAccountsFromPage}
            disabled={isProcessing}
            className="text-[#1d9bf0] hover:bg-[#1d9bf0]/10 px-3 py-1.5 rounded-full text-sm font-bold disabled:opacity-50 transition-colors"
          >
            Rescan
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col min-h-0 bg-[#f7f9f9]/30">
        {!hasChromeApi && (
          <div className="m-4 bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-2xl text-[11px] leading-snug">
            <b>Environment Notice:</b> Build the project and load the <code>dist</code> folder into Chrome to use full features.
          </div>
        )}

        {errorMsg && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {!hasScanned ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-[#eff3f4] text-[#1d9bf0] rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h2 className="text-xl font-black mb-2">Build your network</h2>
            <p className="text-[#536471] text-sm mb-8 leading-relaxed">Scan any page to find X profiles. We'll extract them automatically for bulk following.</p>
            <button 
              onClick={extractAccountsFromPage}
              className="w-full bg-[#1d9bf0] text-white py-3.5 rounded-full font-bold text-base hover:bg-[#1a8cd8] transition-all shadow-sm active:scale-95"
            >
              Scan Current Page
            </button>
          </div>
        ) : (
          <>
            {(isProcessing || stats.total > 0) && (
              <div className="bg-white border-b border-[#eff3f4] px-4 py-3 grid grid-cols-4 gap-2 text-center">
                <div className="flex flex-col"><span className="text-[10px] font-bold text-[#536471]">TOTAL</span><span className="text-sm font-black">{stats.total}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-bold text-[#00ba7c]">DONE</span><span className="text-sm font-black text-[#00ba7c]">{stats.success}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-bold text-[#536471]">SKIP</span><span className="text-sm font-black">{stats.skipped}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-bold text-[#f4212e]">FAIL</span><span className="text-sm font-black text-[#f4212e]">{stats.failed}</span></div>
              </div>
            )}

            {isProcessing && (
              <div className="h-1 w-full bg-[#eff3f4]">
                <div 
                  className="bg-[#1d9bf0] h-full transition-all duration-500 ease-out" 
                  style={{ width: `${((stats.success + stats.skipped + stats.failed) / stats.total) * 100}%` }}
                ></div>
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-2 bg-white/50 backdrop-blur-sm">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={isProcessing}
                  onChange={toggleAll}
                  className="w-5 h-5 rounded border-[#cfd9de] text-[#1d9bf0] focus:ring-0 cursor-pointer"
                />
                <span className="text-sm font-bold text-[#536471] group-hover:text-[#0f1419]">Select All</span>
              </label>
              <span className="text-xs font-medium text-[#536471]">{selectedCount} selected</span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-white">
              <ul className="divide-y divide-[#eff3f4]">
                {accounts.length === 0 ? (
                  <div className="p-12 text-center text-[#536471]">
                    <p className="text-sm">No profiles found.</p>
                  </div>
                ) : (
                  accounts.map((acc, idx) => (
                    <li 
                      key={acc.id} 
                      className={`flex items-center px-4 py-3 transition-colors ${currentIndex === idx ? 'bg-[#1d9bf0]/5' : 'hover:bg-[#f7f9f9]'}`}
                    >
                      <input
                        type="checkbox"
                        checked={acc.selected}
                        disabled={isProcessing}
                        onChange={() => setAccounts(prev => prev.map(a => a.id === acc.id ? {...a, selected: !a.selected} : a))}
                        className="w-5 h-5 rounded border-[#cfd9de] text-[#1d9bf0] focus:ring-0 cursor-pointer"
                      />
                      
                      <div className="ml-3 w-10 h-10 rounded-full bg-[#eff3f4] overflow-hidden shrink-0 border border-[#eff3f4]">
                        {acc.avatar ? (
                          <img src={acc.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#536471]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                          </div>
                        )}
                      </div>

                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0f1419] truncate leading-tight">@{acc.username}</p>
                        {acc.error && <p className="text-[10px] text-[#f4212e] truncate">{acc.error}</p>}
                      </div>
                      
                      <div className="ml-2 shrink-0">
                        {acc.status === 'processing' && <div className="w-4 h-4 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin"></div>}
                        {acc.status === 'success' && <span className="text-[#00ba7c] text-base">✅</span>}
                        {acc.status === 'failed' && <span className="bg-[#f4212e]/10 text-[#f4212e] px-1.5 py-0.5 rounded text-[10px] font-bold">Error</span>}
                        {acc.status === 'skipped' && <span className="bg-[#536471]/10 text-[#536471] px-1.5 py-0.5 rounded text-[10px] font-bold">Skip</span>}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </>
        )}
      </main>

      {hasScanned && (
        <footer className="bg-white border-t border-[#eff3f4] p-4 sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
          {!isProcessing ? (
            <button
              onClick={startTask}
              disabled={selectedCount === 0}
              className="w-full bg-[#0f1419] text-white py-3 rounded-full font-bold text-sm hover:bg-[#272c30] disabled:bg-[#8e99a1] transition-all active:scale-[0.98]"
            >
              Follow Selected ({selectedCount})
            </button>
          ) : (
            <button
              onClick={stopTask}
              className="w-full bg-white text-[#f4212e] border border-[#f4212e]/30 py-3 rounded-full font-bold text-sm hover:bg-[#f4212e]/5 transition-all"
            >
              Stop Process
            </button>
          )}
        </footer>
      )}
    </div>
  );
};

export default App;
