import type { Metadata } from "next";
import Link from "next/link";
import { PiggyBank } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — PocketWise 省省账",
  description: "Privacy policy for the PocketWise personal finance app.",
};

const LAST_UPDATED = "August 3, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-12">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <PiggyBank className="size-5" />
        </span>
        <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
          PocketWise 省省账
        </Link>
      </div>

      {/* English */}
      <section className="flex flex-col gap-6 text-sm leading-relaxed text-foreground">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="mt-1 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <p>
          PocketWise (&quot;PocketWise&quot;, &quot;we&quot;, &quot;our&quot;) is a personal finance tracking app built and
          operated by an independent developer. This policy explains what information PocketWise
          collects, how it is used, and the choices you have. PocketWise is designed around a
          simple principle: your financial data belongs to you, and we collect no more than what
          is needed to run the app.
        </p>

        <div>
          <h2 className="font-semibold">Information we collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium">Account information.</span> When you sign in with
              Google, we receive your name, email address, and profile picture from Google to
              create and identify your account.
            </li>
            <li>
              <span className="font-medium">Financial data you enter.</span> Transactions, account
              balances, budgets, savings projects, tags, payment methods, and recurring rules that
              you create inside the app. PocketWise does not connect to your bank — all figures
              are entered manually by you.
            </li>
            <li>
              <span className="font-medium">App preferences.</span> Settings such as your
              preferred currency, display language, and theme.
            </li>
            <li>
              <span className="font-medium">Optional app lock PIN.</span> If you enable the
              in-app PIN lock, a securely hashed version of your PIN is stored to verify future
              unlocks. We never store your PIN in plain text.
            </li>
            <li>
              <span className="font-medium">Quick Add text (optional feature).</span> If you use
              the &quot;Quick Add&quot; AI assistant to log a transaction by typing or speaking a sentence
              (e.g. &quot;spent 20 on lunch&quot;), that text is sent to Google&apos;s Gemini API to be parsed
              into a structured transaction. This only happens when you actively use that feature.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">How your data is stored</h2>
          <p className="mt-2">
            Your data is stored in a Supabase-hosted PostgreSQL database with row-level security
            enabled, meaning the database itself enforces that you can only ever read or write
            your own records — not other users&apos;. Data is encrypted in transit (HTTPS/TLS) and at
            rest by our infrastructure providers.
          </p>
        </div>

        <div>
          <h2 className="font-semibold">Who we share data with</h2>
          <p className="mt-2">We do not sell your data. We use a small number of infrastructure providers to operate the app:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium">Supabase</span> — database hosting and authentication.
            </li>
            <li>
              <span className="font-medium">Vercel</span> — application hosting.
            </li>
            <li>
              <span className="font-medium">Google</span> — sign-in (OAuth) and, only when you use
              Quick Add, transaction text parsing via the Gemini API.
            </li>
          </ul>
          <p className="mt-2">
            These providers process data on our behalf under their own security and privacy
            commitments, and do not use your data for their own purposes.
          </p>
        </div>

        <div>
          <h2 className="font-semibold">Advertising and analytics</h2>
          <p className="mt-2">
            PocketWise does not show ads, and does not use third-party advertising or analytics
            tracking SDKs.
          </p>
        </div>

        <div>
          <h2 className="font-semibold">Your choices</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>You can edit or delete any transaction, account, budget, or project at any time inside the app.</li>
            <li>You can reset all of your data from Settings.</li>
            <li>
              You can request full account deletion by emailing{" "}
              <a className="text-primary underline" href="mailto:henrylee0077@gmail.com">
                henrylee0077@gmail.com
              </a>{" "}
              — we will delete your account and associated data within 30 days.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">Children&apos;s privacy</h2>
          <p className="mt-2">
            PocketWise is not directed at children under 13, and we do not knowingly collect data
            from children under 13.
          </p>
        </div>

        <div>
          <h2 className="font-semibold">Changes to this policy</h2>
          <p className="mt-2">
            If this policy changes, we will update the date at the top of this page.
          </p>
        </div>

        <div>
          <h2 className="font-semibold">Contact</h2>
          <p className="mt-2">
            Questions about this policy or your data? Email{" "}
            <a className="text-primary underline" href="mailto:henrylee0077@gmail.com">
              henrylee0077@gmail.com
            </a>
            .
          </p>
        </div>
      </section>

      <hr className="border-border" />

      {/* Chinese */}
      <section className="flex flex-col gap-6 text-sm leading-relaxed text-foreground">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">隐私政策</h1>
          <p className="mt-1 text-xs text-muted-foreground">最后更新：{LAST_UPDATED}</p>
        </div>

        <p>
          省省账（PocketWise）是由独立开发者开发和运营的个人理财记账应用。本政策说明省省账收集哪些信息、如何使用这些信息，以及您可以做出的选择。省省账的设计原则很简单：您的财务数据属于您本人，我们只收集运行本应用所必需的最少信息。
        </p>

        <div>
          <h2 className="font-semibold">我们收集的信息</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium">账户信息。</span>
              当您使用 Google 登录时，我们会从 Google 获取您的姓名、电子邮箱和头像，用于创建和识别您的账户。
            </li>
            <li>
              <span className="font-medium">您输入的财务数据。</span>
              您在应用内创建的交易记录、账户余额、预算、储蓄项目、标签、付款方式和周期性规则。省省账不会连接您的银行账户——所有数据均由您手动输入。
            </li>
            <li>
              <span className="font-medium">应用偏好设置。</span>
              例如您偏好的货币、显示语言和主题。
            </li>
            <li>
              <span className="font-medium">可选的应用锁 PIN。</span>
              如果您启用应用内 PIN 锁定功能，我们会存储经过安全哈希处理的 PIN，用于验证后续解锁。我们绝不会以明文形式存储您的
              PIN。
            </li>
            <li>
              <span className="font-medium">快速记账文本（可选功能）。</span>
              如果您使用&quot;快速记账&quot;AI
              助手，通过输入或语音描述一笔交易（例如&quot;午餐花了20元&quot;），该文本会被发送至 Google 的 Gemini
              API 以解析为结构化的交易记录。此功能仅在您主动使用时才会触发。
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">数据存储方式</h2>
          <p className="mt-2">
            您的数据存储在启用了行级安全（Row-Level
            Security）的 Supabase 托管 PostgreSQL 数据库中，数据库本身会强制确保您只能读取或写入自己的数据，无法访问其他用户的数据。数据在传输过程中（HTTPS/TLS）及静态存储时均由我们的基础设施提供商进行加密。
          </p>
        </div>

        <div>
          <h2 className="font-semibold">我们与谁共享数据</h2>
          <p className="mt-2">我们不会出售您的数据。我们使用少量基础设施服务商来运营本应用：</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium">Supabase</span> — 数据库托管与身份验证。
            </li>
            <li>
              <span className="font-medium">Vercel</span> — 应用托管。
            </li>
            <li>
              <span className="font-medium">Google</span> — 登录（OAuth），以及仅在您使用快速记账功能时用于交易文本解析的
              Gemini API。
            </li>
          </ul>
          <p className="mt-2">这些服务商仅代表我们处理数据，并遵循各自的安全与隐私承诺，不会将您的数据用于其自身目的。</p>
        </div>

        <div>
          <h2 className="font-semibold">广告与数据分析</h2>
          <p className="mt-2">省省账不展示广告，也不使用第三方广告或数据分析追踪 SDK。</p>
        </div>

        <div>
          <h2 className="font-semibold">您的选择</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>您可以随时在应用内编辑或删除任何交易、账户、预算或项目。</li>
            <li>您可以在设置中重置您的所有数据。</li>
            <li>
              您可以发送邮件至{" "}
              <a className="text-primary underline" href="mailto:henrylee0077@gmail.com">
                henrylee0077@gmail.com
              </a>{" "}
              申请彻底删除账户——我们将在 30 天内删除您的账户及相关数据。
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">儿童隐私</h2>
          <p className="mt-2">省省账并非面向 13 岁以下儿童，我们不会在明知情况下收集 13 岁以下儿童的数据。</p>
        </div>

        <div>
          <h2 className="font-semibold">政策变更</h2>
          <p className="mt-2">如本政策发生变更，我们会更新本页顶部的日期。</p>
        </div>

        <div>
          <h2 className="font-semibold">联系我们</h2>
          <p className="mt-2">
            对本政策或您的数据有疑问？请发送邮件至{" "}
            <a className="text-primary underline" href="mailto:henrylee0077@gmail.com">
              henrylee0077@gmail.com
            </a>
            。
          </p>
        </div>
      </section>
    </div>
  );
}
