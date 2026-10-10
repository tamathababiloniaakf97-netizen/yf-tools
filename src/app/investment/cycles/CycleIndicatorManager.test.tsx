import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CycleIndicatorManager from './CycleIndicatorManager';

const indicator={id:'remove-me',name:'待删除指标',value_type:'text',value:null,direction:'unknown',zone:'unknown',source:'',observed_on:null,update_frequency_days:30,threshold_note:'',note:'',watch_direction_change:false,active:true} as const;

describe('CycleIndicatorManager',()=>{
  it('persists the reduced array immediately after delete confirmation',async()=>{
    const onSave=vi.fn(async()=>true);
    render(<CycleIndicatorManager indicators={[indicator]} onSave={onSave}/>);
    fireEvent.click(screen.getByRole('button',{name:'管理指标'}));
    fireEvent.click(screen.getByRole('button',{name:'删除 待删除指标'}));
    fireEvent.click(await screen.findByText('确认删除'));
    await waitFor(()=>expect(onSave).toHaveBeenCalledWith([]));
  });
});
