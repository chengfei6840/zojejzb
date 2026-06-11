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

export interface NeedleRecord {
  id: string;
  name: string;
  model: string;
  needleTip: string;
  needleNo: string;
  usage: string;
  brand: string;
  length: number;
  spareWarehouse: number;
  displayOrder: number;
  image: string;
  createdAt: string;
}

export interface NeedlePositionRecord {
  id: string;
  positionNo: string;
  needleId: string;
  needleName: string;
  model: string;
  needleTip: string;
  needleNo: string;
  brand: string;
  stock: number;
  faultStatus: '绑定设备正常' | '绑定设备故障';
  displayOrder: number;
  leverMinSpeed: number;
  leverMaxSpeed: number;
  vibrationMinSpeed: number;
  vibrationMaxSpeed: number;
  vibrationMinTime: number;
  vibrationMaxTime: number;
}

export type ComponentStatus = '正常' | '离线' | '故障' | '升级中';

export interface DeviceComponentRecord {
  id: string;
  name: string;
  address: string;
  type: '储针部件' | '集中控制器' | '包针部件' | '人脸识别部件' | '打印部件';
  status: ComponentStatus;
  version: string;
}

export type AppView = 'dashboard' | 'management' | 'needle' | 'needlePosition' | 'organization' | 'role' | 'user' | 'componentStatus' | 'faceRecognition' | 'needleRecognition' | 'needleBoxDebugging' | 'controllerDebugging' | 'mediaSettings' | 'basicParameterSettings' | 'printSettings' | 'loginSettings' | 'fragmentLossHandling' | 'exchangeTimeSettings' | 'about' | 'reporting';

export type ProcessPhase = 
  | 'idle' 
  /** 换针流程 */
  | 'exchange_select_slot'
  | 'exchange_face_secondary'
  | 'dispense_operation_select'
  | 'dispense_ready'
  | 'dispense_authorized_face'
  | 'dispense_proxy_user_select'
  | 'face_recognition' 
  | 'select_equipment' 
  | 'select_reason' 
  | 'vision_processing' 
  | 'recognition_failed'
  | 'wrapping'
  | 'batch_exchange_continue'
  | 'batch_exchange_place_needle'
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
