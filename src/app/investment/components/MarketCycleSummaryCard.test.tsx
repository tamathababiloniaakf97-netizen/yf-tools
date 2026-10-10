import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MarketCycleSummaryCard from './MarketCycleSummaryCard';

describe('MarketCycleSummaryCard',()=>{
  it('shows all four cycles and keeps alerts separate from phase',()=>{
    render(<MarketCycleSummaryCard loading={false} profiles={[
      {id:'1',cycle_key:'ai_global',name:'全球 AI 产业周期',current_phase:'扩张',confidence:'medium',summary:'需求仍在增长',last_reviewed_at:null,next_review_at:'2026-10-01',review_frequency_days:90,indicators:[],user_id:'u',created_at:'',updated_at:''},
    ]}/>);
    expect(screen.getByText('周期观察')).toBeInTheDocument();
    expect(screen.getByText('全球 AI 产业周期')).toBeInTheDocument();
    expect(screen.getByText('标普 500 估值周期')).toBeInTheDocument();
    expect(screen.getByText('到期复核')).toBeInTheDocument();
    expect(screen.getByRole('link',{name:/进入周期复核/})).toHaveAttribute('href','/investment/cycles');
  });
});
