import type { Metadata } from "next";
import Link from "next/link";
import { PiggyBank } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — PocketWise 省省账",
  description: "Privacy policy for the PocketWise personal finance app.",
};

const LAST_UPDATED = "August 6, 2026";

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
          simple principle: your financial data belongs to you. It is stored only on your own
          device, and we don&apos;t operate a database of our own to collect it into.
        </p>

        <div>
          <h2 className="font-semibold">Information we collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium">Financial data you enter.</span> Transactions, account
              balances, budgets, savings projects, tags, payment methods, and recurring rules that
              you create inside the app. PocketWise does not connect to your bank — all figures
              are entered manually by you, and this data is stored only in your browser&apos;s local
              storage on your device. We never receive or see it.
            </li>
            <li>
              <span className="font-medium">App preferences.</span> Settings such as your
              preferred currency, display language, and theme — also stored only on your device.
            </li>
            <li>
              <span className="font-medium">Optional app lock PIN.</span> If you enable the
              in-app PIN lock, a securely hashed version of your PIN is stored on your device to
              verify future unlocks. We never store your PIN in plain text, and it never leaves
              your device — not even as part of a Google Drive backup.
            </li>
            <li>
              <span className="font-medium">Optional Google account (backup &amp; sync).</span>{" "}
              PocketWise never requires you to sign in. If you choose to connect a Google account
              from Settings to back up or sync your data, we receive your name, email address, and
              profile picture from Google to show you which account is connected. Your financial
              data itself is written directly from your browser to a hidden, app-only folder in
              your own Google Drive (Google calls this &quot;app data&quot; storage) — it never passes
              through, or is stored on, any server we operate.
            </li>
            <li>
              <span className="font-medium">Quick Add text (optional feature).</span> If you use
              the &quot;Quick Add&quot; AI assistant to log a transaction by typing or speaking a sentence
              (e.g. &quot;spent 20 on lunch&quot;), that text — along with the names of your existing
              categories, accounts, and payment methods, so the assistant can match against them —
              is sent to Google&apos;s Gemini API to be parsed into a structured transaction. This
              only happens when you actively use that feature, and the result is sent straight
              back to your device; we don&apos;t log or store it.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">How your data is stored</h2>
          <p className="mt-2">
            PocketWise is a local-first app: all of your financial data is stored in your
            browser&apos;s on-device storage (IndexedDB), the same as any file saved to your phone or
            computer. We do not operate a central database, so as PocketWise grows to more users,
            no one else&apos;s data is ever stored alongside — or accessible from — yours.
          </p>
          <p className="mt-2">
            If you connect Google Drive backup, your data is uploaded directly from your device to
            a hidden folder in your own Google Drive that only PocketWise can see — it does not
            appear in your regular Drive file list, and no other app (including ours, on any
            server) can read it outside of that direct device-to-Drive transfer. Restoring on a
            new device, or syncing between two devices signed into the same Google account, works
            the same way in reverse.
          </p>
        </div>

        <div>
          <h2 className="font-semibold">Who we share data with</h2>
          <p className="mt-2">We do not sell your data, and we do not operate a database that could be shared or breached in the first place. We use a small number of infrastructure providers to run the app itself:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium">Vercel</span> — hosts the PocketWise web app and a
              small number of server functions it uses: Quick Add&apos;s text parsing (described
              above), and Excel/PDF report generation, which briefly receives the transactions
              you&apos;re exporting to build the file and returns it straight back to you. None of
              these functions store your financial data.
            </li>
            <li>
              <span className="font-medium">Google</span> — if you use Quick Add, transaction text
              is parsed via the Gemini API. If you connect Google Drive backup, your device talks
              directly to Google&apos;s Drive API to store and retrieve your backup, and to Google
              Sign-In to identify the connected account.
            </li>
          </ul>
          <p className="mt-2">
            These providers process data under their own security and privacy commitments, and do
            not use your data for their own purposes.
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
            <li>
              You can permanently erase all PocketWise data on a device from Settings &rarr;
              Danger zone, or by uninstalling the app / clearing site data for pocketwise&apos;s web
              address in your browser. Because everything lives on your device, there is no
              separate &quot;account&quot; on our end to delete — deleting the local data (and, if
              connected, disconnecting Google Drive backup from Settings) removes everything.
            </li>
            <li>
              If you connected Google Drive backup and want to remove the backup file itself, you
              can disconnect from Settings, or revoke PocketWise&apos;s access entirely from your{" "}
              <a
                className="text-primary underline"
                href="https://myaccount.google.com/connections"
                target="_blank"
                rel="noreferrer"
              >
                Google Account&apos;s third-party access settings
              </a>
              , which also deletes the hidden app-data backup Google stores on our app&apos;s behalf.
            </li>
            <li>
              Questions about your data are always welcome at{" "}
              <a className="text-primary underline" href="mailto:henrylee0077@gmail.com">
                henrylee0077@gmail.com
              </a>
              .
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
          省省账（PocketWise）是由独立开发者开发和运营的个人理财记账应用。本政策说明省省账收集哪些信息、如何使用这些信息，以及您可以做出的选择。省省账的设计原则很简单：您的财务数据属于您本人，仅保存在您自己的设备上，我们并不运营用于收集这些数据的服务器数据库。
        </p>

        <div>
          <h2 className="font-semibold">我们收集的信息</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium">您输入的财务数据。</span>
              您在应用内创建的交易记录、账户余额、预算、储蓄项目、标签、付款方式和周期性规则。省省账不会连接您的银行账户——所有数据均由您手动输入，并仅保存在您设备浏览器的本地存储中。我们不会接收或看到这些数据。
            </li>
            <li>
              <span className="font-medium">应用偏好设置。</span>
              例如您偏好的货币、显示语言和主题——同样仅保存在您的设备上。
            </li>
            <li>
              <span className="font-medium">可选的应用锁 PIN。</span>
              如果您启用应用内 PIN 锁定功能，经过安全哈希处理的 PIN 会保存在您的设备上，用于验证后续解锁。我们绝不会以明文形式存储您的
              PIN，且它永远不会离开您的设备——即使在 Google Drive 备份中也不例外。
            </li>
            <li>
              <span className="font-medium">可选的 Google 账户（备份与同步）。</span>
              省省账从不要求您登录。如果您在设置中选择连接 Google 账户以备份或同步数据，我们会从 Google
              获取您的姓名、电子邮箱和头像，用于显示当前已连接的账户。您的财务数据本身会由您的浏览器直接写入您自己
              Google Drive 中一个隐藏的、仅限本应用访问的文件夹（Google
              称之为&quot;应用数据&quot;存储）——该数据不会经过、也不会存储在我们运营的任何服务器上。
            </li>
            <li>
              <span className="font-medium">快速记账文本（可选功能）。</span>
              如果您使用&quot;快速记账&quot;AI
              助手，通过输入或语音描述一笔交易（例如&quot;午餐花了20元&quot;），该文本——连同您现有分类、账户和付款方式的名称（以便助手进行匹配）——会被发送至
              Google 的 Gemini API 以解析为结构化的交易记录。此功能仅在您主动使用时才会触发，解析结果会直接返回至您的设备；我们不会记录或存储它。
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">数据存储方式</h2>
          <p className="mt-2">
            省省账是一款本地优先（local-first）的应用：您的所有财务数据都保存在您浏览器的本地存储（IndexedDB）中，就像保存在您手机或电脑上的一份文件一样。我们不运营中心化数据库，因此无论省省账的用户增长到多少，都不会有其他人的数据与您的数据存储在一起，或可被同时访问。
          </p>
          <p className="mt-2">
            如果您连接了 Google Drive 备份，您的数据会由设备直接上传至您自己 Google Drive 中一个仅本应用可见的隐藏文件夹——它不会出现在您常规的 Drive
            文件列表中，除了这种设备与 Drive 之间的直接传输外，没有任何其他应用（包括我们在任何服务器上）能够读取它。在新设备上恢复数据，或在登录同一 Google
            账户的两台设备间同步数据，其原理相同，只是方向相反。
          </p>
        </div>

        <div>
          <h2 className="font-semibold">我们与谁共享数据</h2>
          <p className="mt-2">我们不会出售您的数据，我们也没有可供共享或可能被入侵的数据库。我们使用少量基础设施服务商来运营应用本身：</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium">Vercel</span> —
              托管省省账网页应用，以及它所使用的少量服务器函数：快速记账文本解析（如上文所述），以及
              Excel/PDF 报表生成——该功能会短暂接收您要导出的交易数据以生成文件，并直接返回给您。以上函数均不会存储您的财务数据。
            </li>
            <li>
              <span className="font-medium">Google</span> —
              如果您使用快速记账，交易文本会通过 Gemini API 进行解析；如果您连接了 Google Drive
              备份，您的设备会直接与 Google 的 Drive API 通信以存取备份数据，并通过 Google 登录来识别所连接的账户。
            </li>
          </ul>
          <p className="mt-2">这些服务商仅依照各自的安全与隐私承诺处理数据，不会将您的数据用于其自身目的。</p>
        </div>

        <div>
          <h2 className="font-semibold">广告与数据分析</h2>
          <p className="mt-2">省省账不展示广告，也不使用第三方广告或数据分析追踪 SDK。</p>
        </div>

        <div>
          <h2 className="font-semibold">您的选择</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>您可以随时在应用内编辑或删除任何交易、账户、预算或项目。</li>
            <li>
              您可以在“设置 → 危险操作”中永久清除某台设备上的所有省省账数据，或直接卸载应用/清除浏览器中该网址的网站数据。由于所有数据都保存在您的设备上，我们这边并没有独立的“账户”需要删除——清除本地数据（如已连接
              Google Drive 备份，也在设置中断开连接）即可移除全部数据。
            </li>
            <li>
              如果您已连接 Google Drive 备份，并希望删除备份文件本身，可以在设置中断开连接，或前往您的{" "}
              <a
                className="text-primary underline"
                href="https://myaccount.google.com/connections"
                target="_blank"
                rel="noreferrer"
              >
                Google 账户第三方访问权限设置
              </a>{" "}
              彻底撤销省省账的访问权限，这同时也会删除 Google 为本应用保存的隐藏应用数据备份。
            </li>
            <li>
              如对您的数据有任何疑问，欢迎随时发送邮件至{" "}
              <a className="text-primary underline" href="mailto:henrylee0077@gmail.com">
                henrylee0077@gmail.com
              </a>
              。
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
