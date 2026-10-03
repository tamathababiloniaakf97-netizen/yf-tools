export const dailyThoughtThemes = [
  "long_term_action",
  "investment_business",
  "relationships_parenting",
  "aesthetics_expression_reading",
  "rational_decision",
  "life_health_happiness",
  "review_self_awareness",
] as const;

export type DailyThoughtTheme = (typeof dailyThoughtThemes)[number];

export interface DailyThought {
  id: string;
  text: string;
  attribution: string;
  theme: DailyThoughtTheme;
  reflection: string;
  sourceNote: string;
}

export const dailyThoughtThemeLabels: Record<DailyThoughtTheme, string> = {
  long_term_action: "长期与行动",
  investment_business: "投资与商业",
  relationships_parenting: "关系与育儿",
  aesthetics_expression_reading: "审美、表达与阅读",
  rational_decision: "理性决策",
  life_health_happiness: "生活、健康与幸福",
  review_self_awareness: "复盘与自省",
};

const source = {
  duan: "段永平公开访谈与雪球发言的思想摘要；非原文引语。",
  buffett: "伯克希尔·哈撒韦致股东信的思想摘要；非原文引语。",
  munger: "查理·芒格在伯克希尔股东会公开发言的思想摘要；非原文引语。",
  naval: "Naval Ravikant 官方文章与访谈的思想摘要；非原文引语。",
  aap: "美国儿科学会关于积极养育、游戏与亲子阅读的建议摘要。",
  rams: "Dieter Rams 十项优良设计原则的思想摘要；非原文引语。",
  editorial: "行动工作台编辑原则。",
} as const;

export const dailyThoughts: DailyThought[] = [
  { id: "long-1", text: "长期不是把今天推迟，而是让今天的选择能被时间反复放大。", attribution: "长期主义实践摘要", theme: "long_term_action", reflection: "今天哪一个小动作，五年后仍可能有价值？", sourceNote: source.editorial },
  { id: "long-2", text: "先确认事情本身是对的，再把它持续做对；速度不能替代方向。", attribution: "段永平思想摘要", theme: "long_term_action", reflection: "我正在优化方法，还是应该先重审方向？", sourceNote: source.duan },
  { id: "long-3", text: "能力圈来自真实好奇心与长期积累，不来自追逐别人定义的热门赛道。", attribution: "Naval 思想摘要", theme: "long_term_action", reflection: "什么问题值得我在无人督促时仍持续研究？", sourceNote: source.naval },
  { id: "long-4", text: "复利需要持续留在场内，所以节奏应当能够被身体、注意力和现金流承受。", attribution: "长期主义实践摘要", theme: "long_term_action", reflection: "当前节奏能稳定维持一年吗？", sourceNote: source.editorial },
  { id: "long-5", text: "平常心不是没有目标，而是不让短期结果扰乱长期判断。", attribution: "段永平思想摘要", theme: "long_term_action", reflection: "哪个短期波动正在过度影响我？", sourceNote: source.duan },

  { id: "invest-1", text: "买入股票之前，先把它当作一家要长期持有的企业来理解。", attribution: "巴菲特思想摘要", theme: "investment_business", reflection: "如果不能看价格五年，我仍愿意拥有它吗？", sourceNote: source.buffett },
  { id: "invest-2", text: "优秀生意不仅增长，还能以较少新增资本产生更多现金。", attribution: "巴菲特思想摘要", theme: "investment_business", reflection: "这门生意的增长究竟消耗多少资本？", sourceNote: source.buffett },
  { id: "invest-3", text: "避免明显的愚蠢，往往比持续追求聪明更可靠。", attribution: "芒格思想摘要", theme: "investment_business", reflection: "这个决定有哪些一眼可见却被忽略的失败方式？", sourceNote: source.munger },
  { id: "invest-4", text: "投资回报首先取决于对生意的理解，其次才是对价格的判断。", attribution: "段永平思想摘要", theme: "investment_business", reflection: "我能否不用行业术语解释它如何赚钱？", sourceNote: source.duan },
  { id: "invest-5", text: "成本看似微小，却会在长期复利中持续侵蚀结果。", attribution: "巴菲特思想摘要", theme: "investment_business", reflection: "哪些费用或摩擦正在被我低估？", sourceNote: source.buffett },

  { id: "relation-1", text: "高质量陪伴不是替孩子安排更多，而是进入他的注意力并认真回应。", attribution: "积极养育原则摘要", theme: "relationships_parenting", reflection: "今天我能给孩子哪十分钟不被打断的关注？", sourceNote: source.aap },
  { id: "relation-2", text: "纪律的核心是教会孩子，而不只是让当下的行为停止。", attribution: "积极养育原则摘要", theme: "relationships_parenting", reflection: "我希望孩子从这次边界中真正学会什么？", sourceNote: source.aap },
  { id: "relation-3", text: "稳定的日常节奏能降低不确定性，让孩子更容易合作与自我调节。", attribution: "积极养育原则摘要", theme: "relationships_parenting", reflection: "哪个家庭环节最需要一个简单、稳定的惯例？", sourceNote: source.aap },
  { id: "relation-4", text: "一起阅读的价值不只在识字，也在共同注意、对话与安全感。", attribution: "亲子阅读原则摘要", theme: "relationships_parenting", reflection: "今晚读书时，我可以多问哪个开放问题？", sourceNote: source.aap },
  { id: "relation-5", text: "关系中的信任由许多次小兑现构成，也会被许多次小失约消耗。", attribution: "关系实践摘要", theme: "relationships_parenting", reflection: "今天有哪件答应过的小事需要兑现？", sourceNote: source.editorial },

  { id: "aesthetic-1", text: "好的设计让用途更清楚，而不是用装饰掩盖结构。", attribution: "Dieter Rams 思想摘要", theme: "aesthetics_expression_reading", reflection: "我能删掉哪个不服务于目的的元素？", sourceNote: source.rams },
  { id: "aesthetic-2", text: "克制不是单调，而是让真正重要的东西获得足够空间。", attribution: "Dieter Rams 思想摘要", theme: "aesthetics_expression_reading", reflection: "此处最值得被看见的信息是什么？", sourceNote: source.rams },
  { id: "aesthetic-3", text: "清楚的表达通常来自清楚的取舍，而不只是更多词语。", attribution: "表达实践摘要", theme: "aesthetics_expression_reading", reflection: "这段话若只能保留一句，应该是哪一句？", sourceNote: source.editorial },
  { id: "aesthetic-4", text: "阅读不是收集观点，而是让一个更好的问题改变原有判断。", attribution: "阅读实践摘要", theme: "aesthetics_expression_reading", reflection: "最近哪本书真正修改了我的一个看法？", sourceNote: source.editorial },
  { id: "aesthetic-5", text: "审美会被日常输入塑造；选择看什么，也是在选择未来如何判断。", attribution: "审美实践摘要", theme: "aesthetics_expression_reading", reflection: "我的信息环境正在训练怎样的品味？", sourceNote: source.editorial },

  { id: "decision-1", text: "判断之前先寻找反证；只收集支持材料，会把愿望误当事实。", attribution: "理性决策原则", theme: "rational_decision", reflection: "什么证据出现时，我会承认当前判断错了？", sourceNote: source.editorial },
  { id: "decision-2", text: "把问题倒过来，先问怎样必然失败，常能更快看见关键风险。", attribution: "芒格思想摘要", theme: "rational_decision", reflection: "如果这件事失败，最可能是哪三个原因？", sourceNote: source.munger },
  { id: "decision-3", text: "决策质量与结果不是一回事；好决策也可能遇到坏运气。", attribution: "决策复盘原则", theme: "rational_decision", reflection: "我是在评价过程，还是只在追认结果？", sourceNote: source.editorial },
  { id: "decision-4", text: "声誉比单次收益更难建立，也更容易因一次越界被毁掉。", attribution: "巴菲特思想摘要", theme: "rational_decision", reflection: "如果决定明天公开，我仍愿意这样做吗？", sourceNote: source.buffett },
  { id: "decision-5", text: "不确定时缩小下注，比用自信掩盖未知更理性。", attribution: "风险管理原则", theme: "rational_decision", reflection: "这项决定的可逆性和最坏损失分别是什么？", sourceNote: source.editorial },

  { id: "life-1", text: "健康、时间和注意力是其他目标的底层资产，透支它们会让收益失去意义。", attribution: "生活实践摘要", theme: "life_health_happiness", reflection: "今天哪项安排最需要为身体让路？", sourceNote: source.editorial },
  { id: "life-2", text: "幸福不只来自得到更多，也来自减少那些并非真正属于自己的欲望。", attribution: "Naval 思想摘要", theme: "life_health_happiness", reflection: "哪个欲望主要来自比较，而非真实需要？", sourceNote: source.naval },
  { id: "life-3", text: "休息不是工作的反面，而是长期保持判断力和创造力的必要条件。", attribution: "健康实践摘要", theme: "life_health_happiness", reflection: "我需要怎样的休息，才不是另一种信息消费？", sourceNote: source.editorial },
  { id: "life-4", text: "能被反复享受的简单日常，往往比偶尔的强刺激更接近稳定幸福。", attribution: "生活实践摘要", theme: "life_health_happiness", reflection: "生活里哪件简单小事值得被固定下来？", sourceNote: source.editorial },
  { id: "life-5", text: "真正的自由不仅是拥有选择，也包括敢于拒绝不合适的选择。", attribution: "Naval 思想摘要", theme: "life_health_happiness", reflection: "我现在最需要对什么说不？", sourceNote: source.naval },

  { id: "review-1", text: "复盘不是为过去寻找解释，而是为下一次改变一个具体动作。", attribution: "复盘实践摘要", theme: "review_self_awareness", reflection: "本周哪条经验能转化成下周的明确规则？", sourceNote: source.editorial },
  { id: "review-2", text: "承认不知道，是把事实和自尊分开的开始。", attribution: "自省实践摘要", theme: "review_self_awareness", reflection: "我在哪个问题上用确定语气掩盖了未知？", sourceNote: source.editorial },
  { id: "review-3", text: "如果目标长期没有进展，应同时检查方法、资源和目标本身，而不只责怪意志力。", attribution: "复盘实践摘要", theme: "review_self_awareness", reflection: "停滞的真正瓶颈更像方法、资源还是方向？", sourceNote: source.editorial },
  { id: "review-4", text: "记录当时依据，才能在结果出现后避免重写自己的决策历史。", attribution: "决策日志原则", theme: "review_self_awareness", reflection: "本周哪个重要判断值得补记当时的依据？", sourceNote: source.editorial },
  { id: "review-5", text: "平常心要求回到事情本身，不用结果维护一个关于自己的故事。", attribution: "段永平思想摘要", theme: "review_self_awareness", reflection: "我是在解决问题，还是在维护自我形象？", sourceNote: source.duan },
];
