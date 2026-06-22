export default function IntroPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* ─── HERO ─── */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-600 px-8 py-14 text-center text-white">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-300">
          第３回 月次課題 発表
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight">
          自分専用ワークスペースの紹介
        </h1>
        <p className="mt-4 text-slate-300">
          チームの工事スケジュール管理を題材にした、4ペイン構成の管理画面
        </p>
      </section>

      <div className="mx-auto max-w-5xl space-y-16 px-6 py-14">

        {/* ─── SECTION 1 ─── */}
        <section>
          <SectionHeader number="1" title="ツールの画面" />

          {/* Screenshot placeholder */}
          <div className="mb-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white py-16 text-slate-400">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                🖥️
              </div>
              <p className="font-semibold">起動直後の画面キャプチャ</p>
              <p className="mt-1 text-sm">（画像をここに配置）</p>
            </div>
          </div>

          <p className="mb-8 text-center text-sm text-slate-500">
            起動すると、この画面が立ち上がります。<br />
            職場のチーム全体の工事スケジュール管理を題材にした、<strong>4つに区切られたワークスペース</strong>です。
          </p>

          {/* Big / Small 区分 */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <CategoryLabel color="bg-indigo-600" label="大局（全体把握）" />
            <CategoryLabel color="bg-teal-600" label="局所（直近・詳細）" />
          </div>

          {/* 4 Panes */}
          <div className="grid grid-cols-2 gap-6">
            <PaneCard
              pane="Pane 1"
              color="border-indigo-400 bg-indigo-50"
              badge="大局"
              badgeColor="bg-indigo-100 text-indigo-700"
              title="工事フローの手順書"
              description="工事案件立案〜完了後の事務処理まで、一連のステップを明記"
              points={[
                "経験が浅いメンバーでも工事の流れが分かる（料理レシピ方式）",
                "アイコンで各ステップの取り組みを直感的にイメージできる",
              ]}
            />
            <PaneCard
              pane="Pane 2"
              color="border-indigo-400 bg-indigo-50"
              badge="大局"
              badgeColor="bg-indigo-100 text-indigo-700"
              title="年間工事案件一覧"
              description="年度内に実施予定の全工事案件を列挙"
              points={[
                "直近の施工月のみ常時展開し、情報量を必要最小限に抑制",
                "完了済み案件は薄グレー＋取り消し線で視覚的に区別",
                "納期を赤字で強調表示",
              ]}
            />
            <PaneCard
              pane="Pane 3"
              color="border-teal-400 bg-teal-50"
              badge="局所"
              badgeColor="bg-teal-100 text-teal-700"
              title="直近2週間スケジュール"
              description="現在日程から向こう2週間分の各案件の予定を表示"
              points={[
                "Pane1のアイコンと連動し、アイコンだけで何をすべきか把握できる",
                "アイコンホバーで担当・実施内容等をポップアップ表示",
                "各案件の進捗を色付きバーで視覚化（赤・黄・青緑の3段階）",
              ]}
            />
            <PaneCard
              pane="Pane 4"
              color="border-teal-400 bg-teal-50"
              badge="局所"
              badgeColor="bg-teal-100 text-teal-700"
              title="今後2ヶ月スケジュール"
              description="現在日程から向こう2ヶ月分の指定案件の予定を表示"
              points={[
                "画面右上の「直近 ⇔ 直近＋今後」で表示/非表示をワンクリック切替",
              ]}
            />
          </div>

          {/* 共通・苦労 */}
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
            <p className="mb-3 font-bold text-amber-800">💪 全体共通の苦労</p>
            <ul className="space-y-2 text-sm text-amber-900">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-amber-500">▸</span>
                <span><strong>90点→100点に持っていく作業の大変さを実感</strong>（ルール1：90点→100点の戦いに備えよ）</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-amber-500">▸</span>
                <span><strong>1クリックを減らしながら最適な分かりやすさを保つバランス感</strong>（ルール10：1クリックを減らせ）</span>
              </li>
            </ul>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            フィードバックしていただいた皆さん、貴重なご意見をありがとうございました！
          </p>
        </section>

        {/* ─── SECTION 2 ─── */}
        <section>
          <SectionHeader number="2" title="このツールで解決できる課題" />
          <div className="grid grid-cols-2 gap-6">
            <SolveCard
              who="工事経験が浅いメンバー"
              problem="どう進めたら良いか分からない"
              icon="🆕"
            />
            <SolveCard
              who="工事を取りまとめる人（私）・進捗を管理する人（上司）"
              problem="各案件の進捗度合いを一目で理解したい"
              icon="📊"
            />
          </div>
        </section>

        {/* ─── SECTION 3 ─── */}
        <section>
          <SectionHeader number="3" title="このツールの命名候補" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {NAMES.map((n) => (
              <NameCard key={n.name} {...n} />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-lg font-extrabold text-white">
        {number}
      </div>
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function CategoryLabel({ color, label }: { color: string; label: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 rounded-xl ${color} py-2 text-sm font-bold text-white`}>
      {label}
    </div>
  );
}

function PaneCard({
  pane, color, badge, badgeColor, title, description, points,
}: {
  pane: string;
  color: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${color}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgeColor}`}>{badge}</span>
        <span className="text-xs font-semibold text-slate-500">{pane}</span>
      </div>
      <h3 className="mb-1 font-extrabold">{title}</h3>
      <p className="mb-3 text-sm text-slate-600">{description}</p>
      <ul className="space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="flex gap-1.5 text-sm text-slate-700">
            <span className="mt-0.5 shrink-0">✦</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SolveCard({ who, problem, icon }: { who: string; problem: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 text-3xl">{icon}</div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">対象ユーザー</p>
      <p className="mb-4 font-bold">{who}</p>
      <div className="rounded-xl bg-rose-50 px-4 py-3">
        <p className="text-xs font-semibold text-rose-400">解決する課題</p>
        <p className="mt-1 font-bold text-rose-700">「{problem}」</p>
      </div>
    </div>
  );
}

function NameCard({ name, ruby, desc, funny }: { name: string; ruby?: string; desc: string; funny?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${funny ? "border-yellow-300 bg-yellow-50" : "border-slate-200 bg-white"} shadow-sm`}>
      {funny && <span className="mb-2 inline-block rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-bold text-yellow-800">😄 ユーモア枠</span>}
      <p className="font-extrabold">{name}</p>
      {ruby && <p className="text-xs text-slate-400">{ruby}</p>}
      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

const NAMES = [
  { name: "KenPa", ruby: "ケンパ", desc: "「建」設＋「Pa」ne の造語。掛け声っぽいノリもある。" },
  { name: "GENBA360", desc: "「現場」＋全方位の360。あらゆる角度で管理するイメージ。" },
  { name: "KojiNavi", ruby: "コジナビ", desc: "「工事」＋「ナビゲーション」。流れをナビするツール。" },
  { name: "ShikkuView", ruby: "シックビュー", desc: "「仕切る」＋「View」。洗練（chic）の二重の意味。" },
  { name: "TOBIRA", ruby: "トビラ", desc: "「扉」。各フェーズへの扉を開く管理ツール。" },
  { name: "ドボンなし君", desc: "大失敗を防いでくれる守り神的ツール。君付けが親しみやすい。", funny: true },
  { name: "ヨテイドオリ", desc: "願望を直球で込めつつ、自虐ユーモアも漂う。", funny: true },
  { name: "4ペンギン", desc: "4ペイン＋ペンギン。整列して歩く姿が工程管理と重なる。", funny: true },
];
