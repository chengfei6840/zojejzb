export interface NeedleSlot {
  id: string;
  number: string;
  count: number;
  maxCount: number;
  status: 'empty' | 'available' | 'low' | 'error';
  needleType?: string;
  model?: string;
  image?: string;
  needleNo?: string;
  needleTip?: string;
  needleName?: string;
  usage?: string;
  brand?: string;
}

export type AppView = 'dashboard' | 'management' | 'reporting';

export type ProcessPhase = 
  | 'idle' 
  /** 换针流程（首页 8 步） */
  | 'exchange_put_needle'
  | 'exchange_click_action'
  | 'exchange_face_primary'
  | 'exchange_select_slot'
  | 'exchange_face_secondary'
  | 'face_recognition' 
  | 'select_equipment' 
  | 'select_reason' 
  | 'vision_processing' 
  | 'quantity_input' 
  | 'dispensing' 
  | 'complete';

export interface LogEntry {
  id: string;
  time: string;
  user: string;
  action: '换针' | '领针' | '还针' | '补充' | '清理';
  needleInfo: string;
  result: '成功' | '异常';
  reason?: string;
}
