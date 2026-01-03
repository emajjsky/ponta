'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/**
 * 火山引擎音色列表（OpenAI格式Provider使用）
 * 从 refer.md 文档中的火山引擎API获取
 */
const VOLCENGINE_VOICES = [
  { id: 'zh_female_shuangkuaisisi_moon_bigtts', name: '女声-快思（默认）' },
  { id: 'zh_female_wennuannuan_moon_bigtts', name: '女声-温暖' },
  { id: 'zh_male_qingxing_moon_bigtts', name: '男声-磁性' },
  { id: 'zh_child_qingxin_moon_bigtts', name: '童声-活泼' },
  { id: 'zh_male_xiaowen_moon_bigtts', name: '综艺音色-开心' },
  { id: 'zh_female_wanqudashu_moon_bigtts', name: '湾区大叔' },
  { id: 'zh_female_daimengchuanmei_moon_bigtts', name: '呆萌川妹' },
  { id: 'zh_male_guozhoudege_moon_bigtts', name: '广州德哥' },
  { id: 'zh_male_beijingxiaoye_moon_bigtts', name: '北京小爷' },
  { id: 'zh_male_jingqiangkanye_moon_bigtts', name: '京腔侃爷' },
  { id: 'zh_male_shaonianzixin_moon_bigtts', name: '少年梓辛' },
  { id: 'zh_female_meilinvyou_moon_bigtts', name: '魅力女友' },
  { id: 'zh_male_shenyeboke_moon_bigtts', name: '深夜播客' },
  { id: 'zh_female_sajiaonvyou_moon_bigtts', name: '柔美女友' },
  { id: 'zh_female_yuanqinvyou_moon_bigtts', name: '撒娇学妹' },
  { id: 'zh_male_haoyuxiaoge_moon_bigtts', name: '浩宇小哥' },
  { id: 'zh_male_guangxiyuanzhou_moon_bigtts', name: '广西远舟' },
  { id: 'zh_female_meituojieer_moon_bigtts', name: '妹坨洁儿' },
  { id: 'zh_male_yuzhouzixuan_moon_bigtts', name: '豫州子轩' },
  { id: 'zh_female_linjianvhai_moon_bigtts', name: '邻家女孩' },
  { id: 'zh_female_gaolengyujie_moon_bigtts', name: '高冷御姐' },
  { id: 'zh_male_yuanboxiaoshu_moon_bigtts', name: '渊博小叔' },
  { id: 'zh_male_yangguangqingnian_moon_bigtts', name: '阳光青年' },
  { id: 'zh_male_aojiaobazong_moon_bigtts', name: '傲娇霸总' },
  { id: 'zh_male_wennuanahu_moon_bigtts', name: '温暖阿虎' },
  { id: 'zh_female_wanwanxiaohe_moon_bigtts', name: '湾湾小何' },
  { id: 'zh_female_tianmeixiaoyuan_moon_bigtts', name: '甜美小源' },
  { id: 'zh_female_qingchezizi_moon_bigtts', name: '清澈梓梓' },
  { id: 'zh_male_dongfanghaoran_moon_bigtts', name: '东方浩然' },
  { id: 'zh_male_jieshuoxiaoming_moon_bigtts', name: '解说小明' },
  { id: 'zh_female_kailangjiejie_moon_bigtts', name: '开朗姐姐' },
  { id: 'zh_male_linjiananhai_moon_bigtts', name: '邻家男孩' },
  { id: 'zh_female_tianmeiyueyue_moon_bigtts', name: '甜美悦悦' },
  { id: 'zh_female_xinlingjitang_moon_bigtts', name: '心灵鸡汤' },
  { id: 'zh_female_cancan_mars_bigtts', name: '灿灿' },
]

/**
 * Coze API音色列表（Coze Provider使用）
 * voice_id从Coze API获取: https://api.coze.cn/v1/audio/voices
 * 注意：Coze底层也用火山引擎，但通过voice_id调用
 */
const COZE_VOICES = [
  { id: '7426720361732915209', name: '湾区大叔', speakerId: 'zh_female_wanqudashu_moon_bigtts' },
  { id: '7426720361732931593', name: '呆萌川妹', speakerId: 'zh_female_daimengchuanmei_moon_bigtts' },
  { id: '7426720361732947977', name: '广州德哥', speakerId: 'zh_male_guozhoudege_moon_bigtts' },
  { id: '7426720361732964361', name: '北京小爷', speakerId: 'zh_male_beijingxiaoye_moon_bigtts' },
  { id: '7426720361732997129', name: '少年梓辛', speakerId: 'zh_male_shaonianzixin_moon_bigtts' },
  { id: '7426720361733013513', name: '魅力女友', speakerId: 'zh_female_meilinvyou_moon_bigtts' },
  { id: '7426720361733029897', name: '深夜播客', speakerId: 'zh_male_shenyeboke_moon_bigtts' },
  { id: '7426720361733046281', name: '柔美女友', speakerId: 'zh_female_sajiaonvyou_moon_bigtts' },
  { id: '7426720361733062665', name: '撒娇学妹', speakerId: 'zh_female_yuanqinvyou_moon_bigtts' },
  { id: '7426720361733079049', name: '浩宇小哥', speakerId: 'zh_male_haoyuxiaoge_moon_bigtts' },
  { id: '7426720361733095433', name: '广西远舟', speakerId: 'zh_male_guangxiyuanzhou_moon_bigtts' },
  { id: '7426720361733111817', name: '妹坨洁儿', speakerId: 'zh_female_meituojieer_moon_bigtts' },
  { id: '7426720361733128201', name: '豫州子轩', speakerId: 'zh_male_yuzhouzixuan_moon_bigtts' },
  { id: '7426720361733144585', name: '邻家女孩', speakerId: 'zh_female_linjianvhai_moon_bigtts' },
  { id: '7426720361733160969', name: '高冷御姐', speakerId: 'zh_female_gaolengyujie_moon_bigtts' },
  { id: '7426720361733177353', name: '渊博小叔', speakerId: 'zh_male_yuanboxiaoshu_moon_bigtts' },
  { id: '7426720361733193737', name: '阳光青年', speakerId: 'zh_male_yangguangqingnian_moon_bigtts' },
  { id: '7426720361733210121', name: '傲娇霸总', speakerId: 'zh_male_aojiaobazong_moon_bigtts' },
  { id: '7426720361753870373', name: '京腔侃爷', speakerId: 'zh_male_jingqiangkanye_moon_bigtts' },
  { id: '7426720361753903141', name: '爽快思思', speakerId: 'zh_female_shuangkuaisisi_moon_bigtts' },
  { id: '7426720361753935909', name: '温暖阿虎', speakerId: 'zh_male_wennuanahu_moon_bigtts' },
  { id: '7426720361753968677', name: '湾湾小何', speakerId: 'zh_female_wanwanxiaohe_moon_bigtts' },
  { id: '7426725529589579803', name: '温柔小雅', speakerId: 'zh_female_wenrouxiaoya_moon_bigtts' },
  { id: '7426725529589596187', name: '甜美小源', speakerId: 'zh_female_tianmeixiaoyuan_moon_bigtts' },
  { id: '7426725529589612571', name: '清澈梓梓', speakerId: 'zh_female_qingchezizi_moon_bigtts' },
  { id: '7426725529589628955', name: '东方浩然', speakerId: 'zh_male_dongfanghaoran_moon_bigtts' },
  { id: '7426725529589645339', name: '解说小明', speakerId: 'zh_male_jieshuoxiaoming_moon_bigtts' },
  { id: '7426725529589661723', name: '开朗姐姐', speakerId: 'zh_female_kailangjiejie_moon_bigtts' },
  { id: '7426725529589678107', name: '邻家男孩', speakerId: 'zh_male_linjiananhai_moon_bigtts' },
  { id: '7426725529589694491', name: '甜美悦悦', speakerId: 'zh_female_tianmeiyueyue_moon_bigtts' },
  { id: '7426725529681657907', name: '心灵鸡汤', speakerId: 'zh_female_xinlingjitang_moon_bigtts' },
  { id: '7468512265134768179', name: '灿灿', speakerId: 'zh_female_cancan_mars_bigtts' },
]

interface VoiceTypeSelectorProps {
  provider: 'COZE' | 'OPENAI'
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/**
 * 动态音色选择器组件
 *
 * 根据Provider类型显示不同的音色列表：
 * - COZE: 显示Coze API的音色列表（使用voice_id）
 * - OPENAI: 显示火山引擎的音色列表（使用voice_type）
 *
 * @param provider - AI提供商类型
 * @param value - 当前选中的音色ID
 * @param onChange - 音色变化回调
 * @param disabled - 是否禁用
 */
export function VoiceTypeSelector({ provider, value, onChange, disabled }: VoiceTypeSelectorProps) {
  // 根据provider选择对应的音色列表
  const voices = provider === 'COZE' ? COZE_VOICES : VOLCENGINE_VOICES

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="选择语音合成音色" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto">
        {voices.map((voice) => (
          <SelectItem key={voice.id} value={voice.id}>
            {voice.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
