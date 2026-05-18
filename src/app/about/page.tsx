import { getMilestones, getCases, getResources } from '@/lib/about';
import { FilePdfOutlined, LinkOutlined } from '@ant-design/icons';

export default async function AboutPage() {
  const milestones = await getMilestones();
  const cases = await getCases();
  const resources = await getResources();

  return (
    <div className="bg-white">
      {/* ---------- anchor nav ---------- */}
      <nav
        className="sticky flex gap-8 text-sm border-b bg-white/95 backdrop-blur"
        style={{
          top: 64,
          zIndex: 50,
          padding: '12px 32px',
        }}
      >
        <a href="#bio" className="text-gray-400 hover:text-gray-900 no-underline transition-colors">
          个人简介
        </a>
        <a href="#experience" className="text-gray-400 hover:text-gray-900 no-underline transition-colors">
          投资经历
        </a>
        <a href="#strategy" className="text-gray-400 hover:text-gray-900 no-underline transition-colors">
          策略特长
        </a>
        <a href="#resources" className="text-gray-400 hover:text-gray-900 no-underline transition-colors">
          资源资料
        </a>
        <a href="#contact" className="text-gray-400 hover:text-gray-900 no-underline transition-colors">
          联系方式
        </a>
      </nav>

      {/* ---------- hero / 个人简介 ---------- */}
      <section
        id="bio"
        style={{ padding: '80px 32px 60px', maxWidth: 720, margin: '0 auto' }}
      >
        <h1
          className="text-4xl font-bold mb-3"
          style={{ letterSpacing: 2, color: '#1a1a1a' }}
        >
          远峯
        </h1>
        <p className="text-base text-gray-400 mb-8">
          独立交易者 · 投资教育者
        </p>
        <p
          className="text-base leading-relaxed"
          style={{ color: '#4a4a4a' }}
        >
          专注长期价值投资，十年实战穿越多轮牛熊。从基本面研究起步，逐步构建起"分批建仓 + 长期持有 + 期权增收"三位一体的交易体系。目前致力于将这套方法论沉淀为可复制、可执行的策略框架，帮助更多学员在市场中找到适合自己的长期盈利路径。
        </p>
      </section>

      {/* ---------- 投资经历 ---------- */}
      <section
        id="experience"
        style={{ padding: '60px 32px', maxWidth: 720, margin: '0 auto' }}
      >
        <h2
          className="text-2xl font-bold mb-10"
          style={{ color: '#1a1a1a' }}
        >
          投资经历
        </h2>

        {/* 里程碑 */}
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-6"
          style={{ color: '#bfbfbf' }}
        >
          里程碑
        </h3>
        <div className="relative pl-6 mb-14" style={{ borderLeft: '1px solid #e8e8e8' }}>
          {milestones.map((m, i) => (
            <div
              key={m.id}
              style={{ marginBottom: i === milestones.length - 1 ? 0 : 32, position: 'relative' }}
            >
              <span
                className="absolute inline-block rounded-full"
                style={{
                  left: -29,
                  top: 2,
                  width: 10,
                  height: 10,
                  background: '#1a1a1a',
                }}
              />
              <span
                className="inline-block text-xs font-semibold mb-1 px-2 py-0.5 rounded"
                style={{ color: '#1a1a1a', background: '#f5f5f5' }}
              >
                {m.year}
              </span>
              <h4 className="text-lg font-semibold mt-1 mb-1" style={{ color: '#1a1a1a' }}>
                {m.title}
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                {m.description}
              </p>
            </div>
          ))}
        </div>

        {/* 案例 */}
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-6"
          style={{ color: '#bfbfbf' }}
        >
          投资案例
        </h3>
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          {cases.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-lg border"
              style={{ borderColor: '#f0f0f0', background: '#fafafa' }}
            >
              <h4 className="text-base font-semibold mb-4" style={{ color: '#1a1a1a' }}>
                {c.title}
              </h4>
              <div className="text-sm leading-relaxed space-y-3" style={{ color: '#6b6b6b' }}>
                <div>
                  <span className="font-semibold" style={{ color: '#4a4a4a' }}>
                    背景：
                  </span>
                  {c.context}
                </div>
                <div>
                  <span className="font-semibold" style={{ color: '#4a4a4a' }}>
                    决策：
                  </span>
                  {c.decision}
                </div>
                <div>
                  <span className="font-semibold" style={{ color: '#4a4a4a' }}>
                    执行：
                  </span>
                  {c.execution}
                </div>
                <div>
                  <span className="font-semibold" style={{ color: '#4a4a4a' }}>
                    结果：
                  </span>
                  {c.result}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 策略特长 ---------- */}
      <section
        id="strategy"
        style={{ padding: '60px 32px', maxWidth: 720, margin: '0 auto' }}
      >
        <h2
          className="text-2xl font-bold mb-6"
          style={{ color: '#1a1a1a' }}
        >
          策略特长
        </h2>
        <p className="text-base leading-relaxed" style={{ color: '#4a4a4a' }}>
          我的投资框架以"安全边际"为基石，围绕三根支柱构建：
        </p>
        <ul
          className="text-base leading-relaxed mt-4 space-y-3"
          style={{ color: '#4a4a4a', listStyle: 'none', padding: 0 }}
        >
          <li style={{ paddingLeft: 20, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#1a1a1a' }}>—</span>
            <strong>倒金字塔建仓：</strong>
            左侧交易，越跌越买。根据市场状态（牛市/震荡/熊市）动态调整每层仓位比例，让底部筹码权重最大化。
          </li>
          <li style={{ paddingLeft: 20, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#1a1a1a' }}>—</span>
            <strong>长期持有攒股：</strong>
            以"收集优质公司股权"为目标，每月定投优质标的，股息复投，时间换空间。不预测股价，只关心公司是否持续创造价值。
          </li>
          <li style={{ paddingLeft: 20, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#1a1a1a' }}>—</span>
            <strong>期权增收：</strong>
            卖出虚值看跌期权（sell put）获取权利金，降低持仓等待成本。仅在"愿意以该价格买入"的前提下开仓，不裸卖，不杠杆。
          </li>
        </ul>
        <p className="text-base leading-relaxed mt-6" style={{ color: '#4a4a4a' }}>
          整体风格偏向防御型价值投资，追求低回撤、稳复利。不追逐热点，不做日内交易，也不碰自己不理解的标的。
        </p>
      </section>

      {/* ---------- 资源资料 ---------- */}
      <section
        id="resources"
        style={{ padding: '60px 32px', maxWidth: 720, margin: '0 auto' }}
      >
        <h2
          className="text-2xl font-bold mb-6"
          style={{ color: '#1a1a1a' }}
        >
          资源资料
        </h2>
        <p className="text-base leading-relaxed mb-8" style={{ color: '#4a4a4a' }}>
          精选投资资料与文章，持续更新中。
        </p>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        >
          {resources.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-5 rounded-lg border no-underline transition-shadow hover:shadow-md"
              style={{ borderColor: '#f0f0f0', background: '#fafafa' }}
            >
              <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>
                {r.type === 'pdf' ? (
                  <span style={{ color: '#e74c3c' }}>
                    <FilePdfOutlined />
                  </span>
                ) : (
                  <span style={{ color: '#1677ff' }}>
                    <LinkOutlined />
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <h4
                  className="text-base font-semibold mb-1"
                  style={{ color: '#1a1a1a' }}
                >
                  {r.title}
                </h4>
                {r.description && (
                  <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                    {r.description}
                  </p>
                )}
                <span
                  className="inline-block text-xs mt-2"
                  style={{ color: r.type === 'pdf' ? '#e74c3c' : '#1677ff' }}
                >
                  {r.type === 'pdf' ? '下载 PDF →' : '访问链接 →'}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ---------- 联系方式 ---------- */}
      <section
        id="contact"
        style={{
          padding: '60px 32px 100px',
          maxWidth: 720,
          margin: '0 auto',
          borderTop: '1px solid #f0f0f0',
        }}
      >
        <h2
          className="text-2xl font-bold mb-6"
          style={{ color: '#1a1a1a' }}
        >
          联系方式
        </h2>
        <p className="text-base leading-relaxed mb-4" style={{ color: '#4a4a4a' }}>
          如需进一步了解我的投资体系或探讨合作，欢迎通过以下方式联系：
        </p>
        <div
          className="inline-flex items-center gap-2 px-4 py-3 rounded-lg"
          style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}
        >
          <span style={{ color: '#6b6b6b', fontSize: 14 }}>微信：</span>
          <span style={{ color: '#1a1a1a', fontSize: 14, fontWeight: 500 }}>
            远峯投资
          </span>
        </div>
      </section>
    </div>
  );
}
