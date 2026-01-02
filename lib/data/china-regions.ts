// 中国省市区数据（简化版）
export interface RegionData {
  name: string
  code: string
  children?: ProvinceData[]
}

export interface ProvinceData {
  name: string
  code: string
  children?: CityData[]
}

export interface CityData {
  name: string
  code: string
  children?: DistrictData[]
}

export interface DistrictData {
  name: string
  code: string
}

export const chinaRegions: RegionData[] = [
  {
    name: "北京市",
    code: "110000",
    children: [
      {
        name: "北京市",
        code: "110100",
        children: [
          { name: "东城区", code: "110101" },
          { name: "西城区", code: "110102" },
          { name: "朝阳区", code: "110105" },
          { name: "丰台区", code: "110106" },
          { name: "石景山区", code: "110107" },
          { name: "海淀区", code: "110108" },
          { name: "门头沟区", code: "110109" },
          { name: "房山区", code: "110111" },
          { name: "通州区", code: "110112" },
          { name: "顺义区", code: "110113" },
          { name: "昌平区", code: "110114" },
          { name: "大兴区", code: "110115" },
          { name: "怀柔区", code: "110116" },
          { name: "平谷区", code: "110117" },
          { name: "密云区", code: "110118" },
          { name: "延庆区", code: "110119" }
        ]
      }
    ]
  },
  {
    name: "上海市",
    code: "310000",
    children: [
      {
        name: "上海市",
        code: "310100",
        children: [
          { name: "黄浦区", code: "310101" },
          { name: "徐汇区", code: "310104" },
          { name: "长宁区", code: "310105" },
          { name: "静安区", code: "310106" },
          { name: "普陀区", code: "310107" },
          { name: "虹口区", code: "310109" },
          { name: "杨浦区", code: "310110" },
          { name: "闵行区", code: "310112" },
          { name: "宝山区", code: "310113" },
          { name: "嘉定区", code: "310114" },
          { name: "浦东新区", code: "310115" },
          { name: "金山区", code: "310116" },
          { name: "松江区", code: "310117" },
          { name: "青浦区", code: "310118" },
          { name: "奉贤区", code: "310120" },
          { name: "崇明区", code: "310151" }
        ]
      }
    ]
  },
  {
    name: "广东省",
    code: "440000",
    children: [
      {
        name: "广州市",
        code: "440100",
        children: [
          { name: "荔湾区", code: "440103" },
          { name: "越秀区", code: "440104" },
          { name: "海珠区", code: "440105" },
          { name: "天河区", code: "440106" },
          { name: "白云区", code: "440111" },
          { name: "黄埔区", code: "440112" },
          { name: "番禺区", code: "440113" },
          { name: "花都区", code: "440114" },
          { name: "南沙区", code: "440115" },
          { name: "从化区", code: "440117" },
          { name: "增城区", code: "440118" }
        ]
      },
      {
        name: "深圳市",
        code: "440300",
        children: [
          { name: "罗湖区", code: "440303" },
          { name: "福田区", code: "440304" },
          { name: "南山区", code: "440305" },
          { name: "宝安区", code: "440306" },
          { name: "龙岗区", code: "440307" },
          { name: "盐田区", code: "440308" },
          { name: "龙华区", code: "440309" },
          { name: "坪山区", code: "440310" },
          { name: "光明区", code: "440311" }
        ]
      },
      {
        name: "珠海市",
        code: "440400",
        children: [
          { name: "香洲区", code: "440402" },
          { name: "斗门区", code: "440403" },
          { name: "金湾区", code: "440404" }
        ]
      },
      {
        name: "佛山市",
        code: "440600",
        children: [
          { name: "禅城区", code: "440604" },
          { name: "南海区", code: "440605" },
          { name: "顺德区", code: "440606" },
          { name: "三水区", code: "440607" },
          { name: "高明区", code: "440608" }
        ]
      }
    ]
  },
  {
    name: "浙江省",
    code: "330000",
    children: [
      {
        name: "杭州市",
        code: "330100",
        children: [
          { name: "上城区", code: "330102" },
          { name: "拱墅区", code: "330105" },
          { name: "西湖区", code: "330106" },
          { name: "滨江区", code: "330108" },
          { name: "萧山区", code: "330109" },
          { name: "余杭区", code: "330110" },
          { name: "临平区", code: "330113" },
          { name: "钱塘区", code: "330114" },
          { name: "富阳区", code: "330111" },
          { name: "临安区", code: "330112" },
          { name: "桐庐县", code: "330122" },
          { name: "淳安县", code: "330127" },
          { name: "建德市", code: "330182" }
        ]
      },
      {
        name: "宁波市",
        code: "330200",
        children: [
          { name: "海曙区", code: "330203" },
          { name: "江北区", code: "330205" },
          { name: "北仑区", code: "330206" },
          { name: "镇海区", code: "330211" },
          { name: "鄞州区", code: "330212" },
          { name: "奉化区", code: "330213" },
          { name: "象山县", code: "330225" },
          { name: "宁海县", code: "330226" },
          { name: "余姚市", code: "330281" },
          { name: "慈溪市", code: "330282" }
        ]
      }
    ]
  },
  {
    name: "江苏省",
    code: "320000",
    children: [
      {
        name: "南京市",
        code: "320100",
        children: [
          { name: "玄武区", code: "320102" },
          { name: "秦淮区", code: "320104" },
          { name: "建邺区", code: "320105" },
          { name: "鼓楼区", code: "320106" },
          { name: "浦口区", code: "320111" },
          { name: "栖霞区", code: "320113" },
          { name: "雨花台区", code: "320114" },
          { name: "江宁区", code: "320115" },
          { name: "六合区", code: "320116" },
          { name: "溧水区", code: "320117" },
          { name: "高淳区", code: "320118" }
        ]
      },
      {
        name: "苏州市",
        code: "320500",
        children: [
          { name: "虎丘区", code: "320505" },
          { name: "吴中区", code: "320506" },
          { name: "相城区", code: "320507" },
          { name: "姑苏区", code: "320508" },
          { name: "吴江区", code: "320509" },
          { name: "常熟市", code: "320581" },
          { name: "张家港市", code: "320582" },
          { name: "昆山市", code: "320583" },
          { name: "太仓市", code: "320585" }
        ]
      }
    ]
  }
]
