# Company Research PDF Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure, server-generated PDF download for the currently selected company research, including current research fields, all hypotheses, all evidence, sources, and explicit completeness gaps.

**Architecture:** Keep database access and ownership checks in a dynamic Next.js Route Handler, normalize database rows through a pure report-data builder, and render the resulting immutable view model through a focused PDF generator. The client page only initiates the download and surfaces errors; it does not assemble report content or print the web UI.

**Tech Stack:** Next.js 16 App Router Route Handlers, TypeScript, Supabase SSR, React 19, Ant Design, PDFKit, an embedded open-source Simplified Chinese font, Vitest, Poppler (`pdfinfo` and `pdftoppm`) for final visual QA.

---

## File structure

- `src/lib/investment/research-report.ts`: report view-model types, status labels, sorting, missing-data detection, and safe filename generation.
- `src/lib/investment/research-report.test.ts`: pure report-data and filename tests.
- `src/lib/investment/research-pdf.ts`: PDFKit document layout and Buffer generation; no database access.
- `src/lib/investment/research-pdf.test.ts`: content smoke test and opt-in representative PDF fixture generation.
- `src/assets/fonts/NotoSansSC-Regular.ttf`: project-owned open-source Chinese font used by the server renderer.
- `src/app/api/investment/research/[id]/export/route.ts`: authentication, ownership-scoped queries, error responses, and PDF download response.
- `src/app/api/investment/research/[id]/export/route.test.ts`: route behavior with injected or mocked dependencies.
- `src/app/investment/research/components/ResearchPdfExportButton.tsx`: browser download behavior and visible loading/error feedback.
- `src/app/investment/research/components/ResearchPdfExportButton.test.tsx`: client interaction tests.
- `src/app/investment/research/page.tsx`: place the export action in the selected-company header.
- `package.json`, `package-lock.json`: add the PDFKit runtime and TypeScript declarations.
- `output/pdf/company-research-sample.pdf`: generated QA artifact, not application source; keep only if the repository convention permits generated outputs.
- `tmp/pdfs/company-research-sample-*.png`: temporary rendered pages for inspection; remove after verification.

### Task 1: Build the report view model

**Files:**
- Create: `src/lib/investment/research-report.ts`
- Create: `src/lib/investment/research-report.test.ts`

- [ ] **Step 1: Write failing normalization tests**

Create tests covering Chinese labels, evidence ordering, hypothesis lookup, incomplete fields, source gaps, and Windows-safe filenames. Use a complete `ResearchProfile`, two hypotheses, and three evidence rows; assert the public contract:

```ts
const report = buildResearchReport({ profile, hypotheses, evidence, exportedAt: '2026-10-01T08:00:00.000Z' });

expect(report.meta).toMatchObject({
  assetName: '腾讯/控股',
  status: '研究进行中',
  exportedAt: '2026-10-01T08:00:00.000Z',
});
expect(report.hypotheses[0].statusLabel).toBe('受到挑战');
expect(report.evidence.map((item) => item.content)).toEqual(['最新证据', '较早证据', '无日期证据']);
expect(report.evidence[0].hypothesisStatement).toBe('广告业务恢复增长');
expect(report.gaps.missingCoreFields).toContain('盈利质量');
expect(report.gaps.unresolvedHypothesisCount).toBe(1);
expect(report.gaps.evidenceWithoutSourceCount).toBe(1);
expect(buildResearchPdfFilename('腾讯/控股', new Date('2026-10-01')))
  .toBe('腾讯-控股-当前公司研究-2026-10-01.pdf');
```

- [ ] **Step 2: Run the test and verify the red state**

Run: `npx vitest run src/lib/investment/research-report.test.ts --maxWorkers=1`

Expected: FAIL because `research-report.ts` does not exist.

- [ ] **Step 3: Implement the typed report builder**

Define a database-independent view model and pure functions:

```ts
export interface ResearchReportInput {
  profile: ResearchProfile;
  hypotheses: ResearchHypothesis[];
  evidence: EvidenceRecord[];
  exportedAt: string;
}

export interface ResearchReport {
  meta: {
    assetName: string;
    status: '当前研究' | '研究进行中';
    updatedAt: string;
    exportedAt: string;
  };
  summary: Array<{ label: string; value: string }>;
  sections: Array<{ label: string; value: string }>;
  checklist: Array<{ label: string; statusLabel: string; note: string }>;
  hypotheses: Array<{
    id: string;
    statement: string;
    keyVariables: string;
    statusLabel: string;
    nextCheckAt: string | null;
  }>;
  evidence: Array<{
    content: string;
    impactLabel: string;
    sourceName: string;
    sourceUrl: string | null;
    occurredAt: string | null;
    hypothesisStatement: string | null;
  }>;
  gaps: {
    missingCoreFields: string[];
    unresolvedHypothesisCount: number;
    evidenceWithoutSourceCount: number;
  };
}

export function buildResearchReport(input: ResearchReportInput): ResearchReport;
export function buildResearchPdfFilename(assetName: string, exportedAt: Date): string;
```

Use these six completeness fields only: `business_model`, `customer_value`, `competitive_advantage`, `long_term_assumptions`, `invalidation_conditions`, and `earnings_quality`. Treat evidence as sourced only when either `source_name` or `source_url` is non-empty. Sort evidence descending by `occurred_at`, falling back to `created_at`, and keep input order as the final stable tie breaker.

- [ ] **Step 4: Run the focused test and verify green**

Run: `npx vitest run src/lib/investment/research-report.test.ts --maxWorkers=1`

Expected: PASS.

- [ ] **Step 5: Commit the report-data unit**

```bash
git add -- src/lib/investment/research-report.ts src/lib/investment/research-report.test.ts
git commit -m "feat: build company research report data"
```

### Task 2: Generate a server-side Chinese PDF

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/assets/fonts/NotoSansSC-Regular.ttf`
- Create: `src/lib/investment/research-pdf.ts`
- Create: `src/lib/investment/research-pdf.test.ts`

- [ ] **Step 1: Mark the PDF artifact operation and add dependencies**

Immediately before the first PDF authoring command, run the PDF skill marker exactly once:

```bash
node container_tools/mark_artifact_operation_started.mjs --operation-kind create --expected-output-count 1 --output-format pdf
npm install pdfkit
npm install --save-dev @types/pdfkit
```

Add the regular Simplified Chinese Noto Sans font from the official Google Noto CJK release to `src/assets/fonts/NotoSansSC-Regular.ttf`; retain its license notice if the downloaded archive provides one. Do not depend on a Windows font path.

- [ ] **Step 2: Write the failing PDF smoke test**

Test a representative multi-page report and assert the returned value starts with the PDF signature and is non-trivial in size:

```ts
const pdf = await renderResearchPdf(reportFixture);
expect(Buffer.isBuffer(pdf)).toBe(true);
expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
expect(pdf.byteLength).toBeGreaterThan(10_000);
```

Add an opt-in fixture branch that writes `output/pdf/company-research-sample.pdf` only when `GENERATE_RESEARCH_PDF_FIXTURE=1`, using `mkdirSync` and `writeFileSync`. The ordinary test run must not write files.

- [ ] **Step 3: Run the smoke test and verify the red state**

Run: `npx vitest run src/lib/investment/research-pdf.test.ts --maxWorkers=1`

Expected: FAIL because `renderResearchPdf` does not exist.

- [ ] **Step 4: Implement the PDF renderer**

Implement a single public function:

```ts
export async function renderResearchPdf(report: ResearchReport): Promise<Buffer>;
```

Use PDFKit with A4 size and explicit margins. Register the bundled Chinese font before writing any user text. Add small layout helpers with single responsibilities: `ensureSpace`, `drawSectionHeading`, `drawLabeledText`, `drawRecordCard`, `drawFooter`, and `truncateDisplayUrl`. The renderer must:

- create the cover and disclaimer;
- render summary and company-research sections while omitting empty values;
- show `暂无记录` for empty hypotheses or evidence;
- include textual evidence-impact labels rather than color alone;
- display a shortened link string while adding the full URL as the PDF link target;
- start a new page before a record when the remaining height is insufficient;
- draw consistent page numbers and the company name in the footer;
- render the completeness-gap section without scores or generated advice.

Collect PDFKit stream chunks and resolve only after the `end` event; reject on stream error.

- [ ] **Step 5: Run the focused PDF test**

Run: `npx vitest run src/lib/investment/research-pdf.test.ts --maxWorkers=1`

Expected: PASS and no file under `output/pdf/` during the normal run.

- [ ] **Step 6: Commit the PDF rendering unit**

```bash
git add -- package.json package-lock.json src/assets/fonts/NotoSansSC-Regular.ttf src/lib/investment/research-pdf.ts src/lib/investment/research-pdf.test.ts
git commit -m "feat: render company research PDF"
```

### Task 3: Add the ownership-scoped export API

**Files:**
- Create: `src/app/api/investment/research/[id]/export/route.ts`
- Create: `src/app/api/investment/research/[id]/export/route.test.ts`

- [ ] **Step 1: Write failing route tests**

Mock `createServerSideClient`, `buildResearchReport`, and `renderResearchPdf`. Cover these exact cases:

```ts
expect((await GET(request, context)).status).toBe(401); // no authenticated user
expect((await GET(request, context)).status).toBe(404); // profile absent for user + id
expect((await GET(request, context)).status).toBe(500); // profile/hypothesis/evidence query error

const response = await GET(request, context);
expect(response.status).toBe(200);
expect(response.headers.get('content-type')).toBe('application/pdf');
expect(response.headers.get('content-disposition')).toContain("filename*=UTF-8''");
```

Also assert every profile, hypothesis, and evidence query contains `user_id = authenticatedUser.id`; the nested hypothesis query additionally contains `research_profile_id = id`. Assert no insert, update, upsert, or delete method is called.

- [ ] **Step 2: Run route tests and verify the red state**

Run: `npx vitest run 'src/app/api/investment/research/[id]/export/route.test.ts' --maxWorkers=1`

Expected: FAIL because the export route does not exist.

- [ ] **Step 3: Implement the dynamic GET Route Handler**

Follow the installed Next.js 16 route-handler contract and await params:

```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: RouteContext<'/api/investment/research/[id]/export'>,
) {
  const { id } = await context.params;
  // authenticate, query by user ownership, build report, render PDF
}
```

Query the profile with both `.eq('id', id)` and `.eq('user_id', user.id)`. Query hypotheses with both parent ID and user ID. Query evidence using `asset_name` and user ID so company-level and hypothesis-linked evidence are both included. Return a native `Response` with the PDF buffer, `Content-Type: application/pdf`, `Cache-Control: private, no-store`, and an RFC 5987 UTF-8 filename. Return `404` for an absent ownership-scoped profile and `500` with a Chinese error message for query or rendering failures.

- [ ] **Step 4: Run route tests and the related research tests**

Run:

```bash
npx vitest run 'src/app/api/investment/research/[id]/export/route.test.ts' src/lib/investment/research-report.test.ts src/lib/investment/research-pdf.test.ts --maxWorkers=1
```

Expected: PASS.

- [ ] **Step 5: Commit the export API**

```bash
git add -- 'src/app/api/investment/research/[id]/export/route.ts' 'src/app/api/investment/research/[id]/export/route.test.ts'
git commit -m "feat: expose company research PDF export"
```

### Task 4: Add the download action to the company page

**Files:**
- Create: `src/app/investment/research/components/ResearchPdfExportButton.tsx`
- Create: `src/app/investment/research/components/ResearchPdfExportButton.test.tsx`
- Modify: `src/app/investment/research/page.tsx`

- [ ] **Step 1: Write failing client interaction tests**

Render the button with `profileId="profile-1"` and `assetName="腾讯"`. Mock `fetch`, `URL.createObjectURL`, an anchor element click, and `URL.revokeObjectURL`. Assert:

```ts
expect(fetch).toHaveBeenCalledWith('/api/investment/research/profile-1/export');
expect(screen.getByRole('button', { name: '导出 PDF' })).toBeDisabled(); // while pending
expect(mockAnchor.download).toMatch(/腾讯-当前公司研究-\d{4}-\d{2}-\d{2}\.pdf/);
expect(URL.revokeObjectURL).toHaveBeenCalled();
```

For a non-OK response containing `{ error: '导出失败' }`, assert the Ant Design message surface receives that error and no anchor click occurs.

- [ ] **Step 2: Run the component test and verify the red state**

Run: `npx vitest run src/app/investment/research/components/ResearchPdfExportButton.test.tsx --maxWorkers=1`

Expected: FAIL because the button component does not exist.

- [ ] **Step 3: Implement the download button**

Create a focused client component with this public interface:

```ts
export default function ResearchPdfExportButton({
  profileId,
  assetName,
}: {
  profileId: string;
  assetName: string;
})
```

On click, fetch the export route, parse an error JSON response when possible, convert a successful response to a Blob, create a temporary object URL, click a temporary download anchor, and always revoke the object URL. Use `DownloadOutlined`, the label `导出 PDF`, and the button loading state. Do not add a modal or a snapshot prerequisite.

- [ ] **Step 4: Place the action in the selected-company header**

Change the selected-company card header so the company identity and updated time remain on the left and `ResearchPdfExportButton` is on the right. Do not show the button when `selected` is null. Leave tabs and editor behavior unchanged.

- [ ] **Step 5: Run focused UI and research tests**

Run:

```bash
npx vitest run src/app/investment/research/components/ResearchPdfExportButton.test.tsx src/lib/investment/research-report.test.ts src/lib/investment/research-pdf.test.ts --maxWorkers=1
```

Expected: PASS.

- [ ] **Step 6: Commit the company-page action**

```bash
git add -- src/app/investment/research/page.tsx src/app/investment/research/components/ResearchPdfExportButton.tsx src/app/investment/research/components/ResearchPdfExportButton.test.tsx
git commit -m "feat: download current company research PDF"
```

### Task 5: Verify the complete feature and inspect the rendered PDF

**Files:**
- Generate: `output/pdf/company-research-sample.pdf`
- Generate temporarily: `tmp/pdfs/company-research-sample-*.png`

- [ ] **Step 1: Run the complete automated verification**

Run:

```bash
npx vitest run src/lib/investment/research-report.test.ts src/lib/investment/research-pdf.test.ts 'src/app/api/investment/research/[id]/export/route.test.ts' src/app/investment/research/components/ResearchPdfExportButton.test.tsx --maxWorkers=1
npm run typecheck
npm run lint
npm run build
```

Expected: all tests pass, TypeScript reports no errors, ESLint reports no errors, and Next.js production build succeeds.

- [ ] **Step 2: Generate the representative PDF fixture**

Run in PowerShell:

```powershell
$env:GENERATE_RESEARCH_PDF_FIXTURE='1'
npx vitest run src/lib/investment/research-pdf.test.ts --maxWorkers=1
Remove-Item Env:GENERATE_RESEARCH_PDF_FIXTURE
```

Expected: `output/pdf/company-research-sample.pdf` exists and is larger than 10 KB.

- [ ] **Step 3: Validate PDF structure and extracted content**

Run:

```bash
pdfinfo output/pdf/company-research-sample.pdf
pdftotext output/pdf/company-research-sample.pdf -
```

Expected: A4 pages, more than one page for the long fixture, and extracted text includes `当前公司研究报告`, `假设与验证`, `证据记录`, `资料缺口`, and the fixture company name.

- [ ] **Step 4: Render every page to PNG and inspect it**

Run:

```powershell
New-Item -ItemType Directory -Force 'tmp/pdfs'
pdftoppm -png -r 150 'output/pdf/company-research-sample.pdf' 'tmp/pdfs/company-research-sample'
```

Inspect every generated page image. Reject the implementation if Chinese text is missing, text overlaps or clips, long links overflow, headings are orphaned, record blocks split unreadably, page numbers drift, or evidence direction depends only on color. Fix the renderer and repeat Steps 1-4 until there are zero visible defects.

- [ ] **Step 5: Verify the browser flow against local data**

With the local app running, open `/investment/research`, select a company, click `导出 PDF`, and confirm the browser downloads the current company report. Confirm an incomplete company still exports with `研究进行中` and a资料缺口 section. Confirm the action neither creates a research snapshot nor changes the research updated time.

- [ ] **Step 6: Remove temporary render images and commit final verification adjustments**

Delete only the verified files under `tmp/pdfs/company-research-sample-*.png`. Keep or remove the sample PDF according to repository artifact policy; if kept, it is the single expected PDF artifact.

```bash
git add -- src package.json package-lock.json
git commit -m "test: verify company research PDF export"
```

If the final verification required no source changes, do not create an empty commit.
