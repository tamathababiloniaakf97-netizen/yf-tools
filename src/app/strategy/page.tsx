'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Spin, App, Typography, Modal, Input } from 'antd';
import AuthGuard from '@/components/AuthGuard';
import StrategyHistorySelect from './components/StrategyHistorySelect';
import StrategyList from './components/StrategyList';
import StrategyExamples from './components/StrategyExamples';
import HoldingsTable from './components/HoldingsTable';
import IntentSelector from './components/IntentSelector';
import StrategyInput from './components/StrategyInput';
import AiSuggestions from './components/AiSuggestions';
import StrategyPlaybook from './components/StrategyPlaybook';
import type { StrategyHolding, StrategyIntent, StrategyIVLevel, StrategyStatus, StrategySummary } from '@/types';

const { Title, Text } = Typography;

const STORAGE_KEY = 'yf_strategy_draft';

interface AiResult {
  riskLevel: string;
  riskWarnings: string[];
  optimizationSuggestions: string[];
  principleCheck: {
    capitalPreservation: boolean;
    positiveCarry: boolean;
    hedgeRatio: boolean;
    cashReserve: boolean;
  };
  playbook: Record<string, unknown>;
}

export default function StrategyPage() {
  const { message } = App.useApp();

  // 左栏状态
  const [strategies, setStrategies] = useState<StrategySummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<StrategyHolding[]>([]);
  const [intent, setIntent] = useState<StrategyIntent | null>(null);
  const [ivLevel, setIVLevel] = useState<StrategyIVLevel | null>(null);
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<StrategyStatus>('规划中');

  // 右栏状态
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // 风控确认
  const [capabilityConfirmed, setCapabilityConfirmed] = useState(false);
  const [disciplineConfirmed, setDisciplineConfirmed] = useState(false);

  // 保存弹窗
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<'overwrite' | 'copy'>('overwrite');
  const [saveTitle, setSaveTitle] = useState('');

  // PDF 导出 ref
  const rightColRef = useRef<HTMLDivElement>(null);

  // 加载策略列表
  const loadStrategyList = useCallback(async () => {
    try {
      const res = await fetch('/api/strategies');
      if (res.ok) {
        const data = await res.json();
        setStrategies(data);
      }
    } catch {
      // 静默失败
    }
  }, []);

  useEffect(() => {
    loadStrategyList().finally(() => setPageLoading(false));
  }, [loadStrategyList]);

  // 从 localStorage 恢复未保存的草稿
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.holdings) setHoldings(draft.holdings);
      if (draft.intent) setIntent(draft.intent);
      if (draft.ivLevel) setIVLevel(draft.ivLevel);
      if (draft.userInput) setUserInput(draft.userInput);
      if (draft.selectedId) setSelectedId(draft.selectedId);
      if (draft.status) setStatus(draft.status);
      if (draft.aiResult) setAiResult(draft.aiResult);
      if (draft.capabilityConfirmed !== undefined) setCapabilityConfirmed(draft.capabilityConfirmed);
      if (draft.disciplineConfirmed !== undefined) setDisciplineConfirmed(draft.disciplineConfirmed);
    } catch {
      // 草稿损坏，忽略
    }
  }, []);

  // 自动保存草稿到 localStorage
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        holdings,
        intent,
        ivLevel,
        userInput,
        selectedId,
        status,
        aiResult,
        capabilityConfirmed,
        disciplineConfirmed,
      }));
    } catch {
      // localStorage 不可用，忽略
    }
  }, [holdings, intent, ivLevel, userInput, selectedId, status, aiResult, capabilityConfirmed, disciplineConfirmed]);

  // 清除 localStorage 草稿
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 忽略
    }
  }, []);

  // 自动保存草稿（防抖 1 秒）
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDraft(), 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [saveDraft]);

  // 选择历史策略 → 加载完整数据
  const handleSelectStrategy = useCallback(async (id: string | null) => {
    if (!id) {
      // 新建
      setSelectedId(null);
      setHoldings([]);
      setIntent(null);
      setIVLevel(null);
      setUserInput('');
      setAiResult(null);
      setStatus('规划中');
      setCapabilityConfirmed(false);
      setDisciplineConfirmed(false);
      return;
    }

    try {
      const res = await fetch(`/api/strategies/${id}`);
      if (!res.ok) throw new Error('加载失败');
      const s = await res.json();
      setSelectedId(s.id);
      setHoldings(s.holdings || []);
      setIntent(s.intent);
      setIVLevel(s.iv_level);
      setUserInput(s.user_input || '');
      setStatus(s.status || '规划中');
      if (s.edited_playbook) {
        setAiResult({
          riskLevel: s.risk_level || '平衡',
          riskWarnings: (s.ai_response && typeof s.ai_response === 'object' && s.ai_response !== null
            ? (Array.isArray((s.ai_response as Record<string, unknown>).riskWarnings) ? (s.ai_response as Record<string, unknown>).riskWarnings as string[] : [])
            : []),
          optimizationSuggestions: (s.ai_response && typeof s.ai_response === 'object' && s.ai_response !== null
            ? (Array.isArray((s.ai_response as Record<string, unknown>).optimizationSuggestions) ? (s.ai_response as Record<string, unknown>).optimizationSuggestions as string[] : [])
            : []),
          principleCheck: (s.ai_response && typeof s.ai_response === 'object' && s.ai_response !== null
            ? ((s.ai_response as Record<string, unknown>).principleCheck as AiResult['principleCheck']) || {
                capitalPreservation: true,
                positiveCarry: true,
                hedgeRatio: true,
                cashReserve: true,
              }
            : {
                capitalPreservation: true,
                positiveCarry: true,
                hedgeRatio: true,
                cashReserve: true,
              }),
          playbook: s.edited_playbook,
        });
        const rc = (s.edited_playbook as Record<string, unknown>)?.riskControl as Record<string, unknown> | undefined;
        setCapabilityConfirmed((rc?.capabilityConfirmed as boolean) ?? false);
        setDisciplineConfirmed((rc?.disciplineConfirmed as boolean) ?? false);
      }
    } catch {
      message.error('加载策略失败');
    }
  }, [message]);

  // 删除策略
  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/strategies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      message.success('已删除');
      setSelectedId(null);
      setHoldings([]);
      setIntent(null);
      setIVLevel(null);
      setUserInput('');
      setAiResult(null);
      setStatus('规划中');
      loadStrategyList();
    } catch {
      message.error('删除失败');
    }
  }, [message, loadStrategyList]);

  // 从成本记录导入
  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/positions');
      if (!res.ok) throw new Error('导入失败');
      const data = await res.json();
      const positions = (data.tickers || []).map((t: { code: string; type: string; current_price: number | null }) => ({
        ticker: t.code,
        type: t.type === 'option' ? '期权' : '股票',
        quantity: 0,
        costPrice: 0,
        currentPrice: t.current_price || undefined,
        isFirstOrOnly: false,
      }));
      if (positions.length === 0) {
        message.info('暂无持仓数据');
      } else {
        setHoldings(positions);
        message.success(`已导入 ${positions.length} 个标的`);
      }
    } catch {
      message.error('导入失败');
    } finally {
      setImporting(false);
    }
  }, [message]);

  // 示例卡片点击
  const handleExampleSelect = useCallback((text: string) => {
    setUserInput(text);
  }, []);

  // 生成 AI 策略
  const handleGenerate = useCallback(async () => {
    if (userInput.trim().length < 50) {
      message.warning('请补充更多策略细节（至少50字）');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/strategy/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings,
          intent,
          ivEnv: ivLevel,
          userInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');
      setAiResult(data);
      message.success('策略生成完成');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI服务暂时不可用，请稍后重试';
      message.error(msg);
    } finally {
      setGenerating(false);
    }
  }, [holdings, intent, ivLevel, userInput, message]);

  // 重置
  const handleReset = useCallback(() => {
    setHoldings([]);
    setIntent(null);
    setIVLevel(null);
    setUserInput('');
    setAiResult(null);
    setStatus('规划中');
    setCapabilityConfirmed(false);
    setDisciplineConfirmed(false);
    clearDraft();
  }, [clearDraft]);

  // 保存弹窗
  const handleSaveClick = useCallback(() => {
    if (!aiResult) return;
    setSaveTitle(aiResult.playbook?.overview && typeof aiResult.playbook.overview === 'object'
      ? ((aiResult.playbook.overview as Record<string, unknown>).title as string) || '未命名策略'
      : '未命名策略');
    setSaveMode(selectedId ? 'overwrite' : 'copy');
    setSaveModalOpen(true);
  }, [aiResult, selectedId]);

  const handleSaveConfirm = useCallback(async () => {
    setSaveModalOpen(false);
    try {
      const mergedPlaybook = aiResult?.playbook ? {
        ...aiResult.playbook,
        riskControl: {
          ...((aiResult.playbook as Record<string, unknown>).riskControl || {}),
          capabilityConfirmed,
          disciplineConfirmed,
        },
      } : undefined;

      const body = {
        title: saveTitle,
        status: status,
        intent: intent,
        iv_level: ivLevel,
        holdings,
        user_input: userInput,
        ai_response: aiResult,
        edited_playbook: mergedPlaybook,
        risk_level: aiResult?.riskLevel,
      };

      let res: Response;
      if (saveMode === 'overwrite' && selectedId) {
        res = await fetch(`/api/strategies/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        // 另存为副本
        if (saveMode === 'copy') {
          body.title = body.title + ' V2';
        }
        res = await fetch('/api/strategies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: '未知错误' }));
        throw new Error(errData.error || `保存失败 (${res.status})`);
      }
      const saved = await res.json();
      setSelectedId(saved.id);
      message.success(saveMode === 'overwrite' ? '已覆盖保存' : '已另存为副本');
      loadStrategyList();
      clearDraft();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败';
      message.error(`保存失败：${msg}`);
    }
  }, [saveTitle, status, intent, ivLevel, holdings, userInput, aiResult, saveMode, selectedId, message, loadStrategyList, capabilityConfirmed, disciplineConfirmed, clearDraft]);

  // 编辑 playbook 某个区块
  const handlePlaybookChange = useCallback((section: string, value: unknown) => {
    if (section === 'status') {
      setStatus(value as StrategyStatus);
      return;
    }

    setAiResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        playbook: {
          ...prev.playbook,
          [section]: value,
        },
      };
    });
  }, []);

  const handleEntryReferenceHighChange = useCallback((v: number) => {
    handlePlaybookChange('entryReferencePrice', { price: v });
  }, []);

  const handleExitReferenceLowChange = useCallback((v: number) => {
    handlePlaybookChange('exitReferencePrice', { price: v });
  }, []);

  const entryReferenceHigh = (aiResult?.playbook?.entryReferencePrice as Record<string, unknown>)?.price as number ?? 0;
  const exitReferenceLow = (aiResult?.playbook?.exitReferencePrice as Record<string, unknown>)?.price as number ?? 0;

  const handleTotalCashChange = useCallback((v: number) => {
    handlePlaybookChange('cashSettings', { totalCash: v });
  }, []);

  const totalCash = (aiResult?.playbook?.cashSettings as Record<string, unknown>)?.totalCash as number ?? 0;

  if (pageLoading) {
    return (
      <AuthGuard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      {/* 页面标题 */}
      <div className="yf-page-title" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          AI策略构建
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 400, marginLeft: 12 }}>
            不预测，只应对 — 将投资想法转化为可执行的操作手册
          </Text>
        </Title>
      </div>

      {/* 左右分栏 */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* ---- 左栏：输入区 ---- */}
        <div className="yf-left-panel" style={{ flex: '1 1 440px', minWidth: 400, maxWidth: 620 }}>
          <StrategyHistorySelect
            strategies={strategies}
            selectedId={selectedId}
            onSelect={handleSelectStrategy}
          />

          <div style={{ marginTop: 12 }}>
            <StrategyExamples onSelect={handleExampleSelect} />
          </div>

          <HoldingsTable
            holdings={holdings}
            onChange={setHoldings}
            onImport={handleImport}
            importing={importing}
          />

          <IntentSelector
            intent={intent}
            ivLevel={ivLevel}
            onIntentChange={setIntent}
            onIVChange={setIVLevel}
          />

          <StrategyInput
            userInput={userInput}
            onInputChange={setUserInput}
            onGenerate={handleGenerate}
            onReset={handleReset}
            onSave={handleSaveClick}
            generating={generating}
            hasResult={aiResult !== null}
          />

          <StrategyList
            strategies={strategies}
            selectedId={selectedId}
            onSelect={handleSelectStrategy}
            onDelete={handleDelete}
          />
        </div>

        {/* ---- 右栏：AI 建议 + 策略手册 ---- */}
        <div
          className="yf-right-panel"
          style={{
            flex: '1 1 600px',
            minWidth: 500,
            position: 'sticky',
            top: 16,
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
          }}
          ref={rightColRef}
        >
          {aiResult && !generating && (
            <div className="yf-print-hide" style={{ textAlign: 'right', marginBottom: 8 }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  border: '1px solid #1677ff',
                  borderRadius: 4,
                  background: '#1677ff',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                🖨 打印
              </button>
            </div>
          )}
          {generating && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">AI 正在生成策略方案...</Text>
              </div>
            </div>
          )}

          {!generating && aiResult && (
            <>
              <AiSuggestions
                riskLevel={aiResult.riskLevel}
                riskWarnings={aiResult.riskWarnings}
                optimizationSuggestions={aiResult.optimizationSuggestions}
                principleCheck={aiResult.principleCheck}
              />
              <StrategyPlaybook
                data={aiResult.playbook as any}
                status={status}
                intent={intent || ''}
                onFieldChange={handlePlaybookChange}
                capabilityConfirmed={capabilityConfirmed}
                disciplineConfirmed={disciplineConfirmed}
                onCapabilityChange={setCapabilityConfirmed}
                onDisciplineChange={setDisciplineConfirmed}
                entryReferenceHigh={entryReferenceHigh}
                onEntryReferenceHighChange={handleEntryReferenceHighChange}
                exitReferenceLow={exitReferenceLow}
                onExitReferenceLowChange={handleExitReferenceLowChange}
                totalCash={totalCash}
                onTotalCashChange={handleTotalCashChange}
                holdings={holdings}
              />
            </>
          )}

          {!generating && !aiResult && (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: '#fafafa',
              borderRadius: 8,
              border: '1px dashed #d9d9d9',
            }}>
              <Text type="secondary" style={{ fontSize: 15 }}>
                填写左侧信息后，点击"生成 AI 策略方案"
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* 保存弹窗 */}
      <Modal
        title="保存策略"
        open={saveModalOpen}
        onOk={handleSaveConfirm}
        onCancel={() => setSaveModalOpen(false)}
        okText="确认保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>策略标题</label>
          <Input value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>保存方式</div>
        {selectedId && (
          <div style={{ marginBottom: 8 }}>
            <label>
              <input
                type="radio"
                name="saveMode"
                value="overwrite"
                checked={saveMode === 'overwrite'}
                onChange={() => setSaveMode('overwrite')}
                style={{ marginRight: 6 }}
              />
              覆盖保存（更新当前策略）
            </label>
          </div>
        )}
        <div>
          <label>
            <input
              type="radio"
              name="saveMode"
              value="copy"
              checked={saveMode === 'copy'}
              onChange={() => setSaveMode('copy')}
              style={{ marginRight: 6 }}
            />
            另存为副本（标题自动加 V2 后缀）
          </label>
        </div>
      </Modal>
    </AuthGuard>
  );
}
