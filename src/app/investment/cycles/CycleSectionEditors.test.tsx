import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EvidenceEditor, JudgmentEditor, PriceEditor, ThoughtEditor } from './CycleSectionEditors';

const profile={id:'cycle-1',ticker_id:null,current_phase:'启动',confidence:'medium',summary:'判断',support_evidence:'支持',counter_evidence:'反面',uncertainties:'未知',next_review_at:'2026-11-01',cycle_started_on:null,cycle_start_price:null,latest_price:null,latest_price_on:null} as never;

describe('cycle section editors',()=>{
  it('provides a separate edit entry for each current-profile section',()=>{
    const onSave=vi.fn(async()=>true);
    render(<><PriceEditor profile={profile} tickers={[]} onSave={onSave}/><JudgmentEditor profile={profile} onSave={onSave}/><EvidenceEditor profile={profile} onSave={onSave}/><ThoughtEditor profile={profile} onSave={onSave}/></>);
    for(const label of ['编辑价格','编辑判断','编辑证据','编辑待思考']){
      const button=screen.getByRole('button',{name:label});
      expect(button).toHaveClass('cycle-edit-icon');
      expect(button.querySelector('.anticon-edit')).toBeInTheDocument();
      expect(button).not.toHaveTextContent(label);
    }
  });
});
