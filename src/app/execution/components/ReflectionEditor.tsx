'use client';

import React, { useState, useCallback } from 'react';
import { Input, Button, App } from 'antd';

const { TextArea } = Input;

interface ReflectionEditorProps {
  value: string;
  onSave: (text: string) => Promise<void>;
}

export default function ReflectionEditor({ value, onSave }: ReflectionEditorProps) {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();

  // Sync external value changes
  React.useEffect(() => {
    setText(value);
  }, [value]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newText = text.trim()
        ? `[${ts}]\n${text.trim()}`
        : '';
      await onSave(newText);
      message.success('已保存');
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  }, [text, saving, onSave, message]);

  return (
    <div>
      <TextArea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="记录执行中的观察、偏差和反思..."
        style={{ fontSize: 13 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#bbb' }}>
          保存时自动添加时间戳
        </span>
        <Button
          size="small"
          type="primary"
          onClick={handleSave}
          loading={saving}
        >
          保存反思
        </Button>
      </div>
    </div>
  );
}
