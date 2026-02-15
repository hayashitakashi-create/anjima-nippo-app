// 作業日報の定数

// マスタデータ（APIから取得できなかった場合のフォールバック）
export const DEFAULT_PROJECT_TYPES = [
  '建築塗装工事',
  '鋼橋塗装工事',
  '防水工事',
  '建築工事',
  '区画線工事',
]

export const WORKER_NAMES = [
  '古藤　英紀', '矢野　誠', '山内　正和', '大塚　崇', '中原　稔', '三嶋　晶',
  '伊藤　勝', '古曳　正樹', '松本　太', '佐野　弘和', '満田　純一', '齊藤　慰丈',
  '井原　晃', '松本　誠', '加藤　光', '堀内　光雄', '梶谷　純', '金藤　恵子',
  '安島　圭介', '山﨑　伸一', '足立　憲吉', '福田　誠', '安島　隆', '金山　昭徳',
  '安島　篤志', '松本　倫典', '田邊　沙帆', '古川　一彦', '内田　邦男', '藤原　秀夫',
  '田中　剛士', '小林　敬博', '福代　司', '池野　大樹', '中谷　凜大', '安部　倫太朗'
]

export const DEFAULT_VOLUME_UNITS = ['ℓ', 'mℓ', 'm', '㎝']

export const DEFAULT_SUBCONTRACTORS = [
  'キョウワビルト工業', '広野組', '又川工業', '景山工業',
  '森下塗装', '鳥島工業', '岩佐塗装', '恒松塗装'
]

export const WEATHER_OPTIONS = ['晴れ', '曇り', '晴れ後曇り', '曇り後晴れ', '雨', '雪']

// 30分刻みの時刻リストを生成（00:00-23:30）
export const generateTimeOptions = (): string[] => {
  const options: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      options.push(timeStr)
    }
  }
  return options
}

export const TIME_OPTIONS = generateTimeOptions()

// 最大件数
export const MAX_WORKER_RECORDS = 11
export const MAX_MATERIAL_RECORDS = 5
export const MAX_SUBCONTRACTOR_RECORDS = 10
export const MAX_CONTACT_NOTES_LENGTH = 500
