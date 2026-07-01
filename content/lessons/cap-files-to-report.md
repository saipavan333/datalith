# Capstone: files to a published report

A huge part of data engineering is the **last mile** — turning correct data into something a stakeholder actually opens.
This capstone starts from raw files and ends with a formatted Excel workbook plus charts, doing the math in DuckDB and
the presentation in seaborn and openpyxl.

@@diagram:capstone-report

## The shape

```
raw files  →  DuckDB (SQL: joins, window functions)  →  seaborn/matplotlib (charts)  +  openpyxl (Excel)  →  report
```

## 1. Transform in SQL (DuckDB)

Do the heavy lifting where it's fastest and most readable. DuckDB reads the files in place; window functions and joins
that would be awkward in pandas are one query each.

```python
import duckdb
con = duckdb.connect()

# revenue by region (a simple aggregate)
by_region = con.sql("""
    SELECT region, sum(amount) AS revenue, count(*) AS orders
    FROM 'data/sales/*.parquet'
    WHERE amount > 0
    GROUP BY region ORDER BY revenue DESC
""").df()

# monthly trend with month-over-month change (a window function)
monthly = con.sql("""
    WITH m AS (
      SELECT date_trunc('month', order_date) AS month, sum(amount) AS rev
      FROM 'data/sales/*.parquet' GROUP BY 1
    )
    SELECT month, rev,
           rev - lag(rev) OVER (ORDER BY month) AS delta,
           round(100.0*(rev - lag(rev) OVER (ORDER BY month)) / lag(rev) OVER (ORDER BY month), 1) AS pct
    FROM m ORDER BY month
""").df()

# top 3 products per region (a window + QUALIFY)
top = con.sql("""
    SELECT region, product, revenue FROM (
      SELECT region, product, sum(amount) AS revenue
      FROM 'data/sales/*.parquet' GROUP BY region, product)
    QUALIFY row_number() OVER (PARTITION BY region ORDER BY revenue DESC) <= 3
""").df()
```

## 2. Build the charts (seaborn / matplotlib)

```python
import seaborn as sns, matplotlib.pyplot as plt
sns.set_theme(style='whitegrid')

# trend line
fig, ax = plt.subplots(figsize=(9, 4))
sns.lineplot(data=monthly, x='month', y='rev', marker='o', ax=ax)
ax.set_title('Monthly revenue'); ax.set_ylabel('USD')
fig.savefig('charts/trend.png', dpi=150, bbox_inches='tight')

# revenue by region bar
fig, ax = plt.subplots(figsize=(7, 4))
sns.barplot(data=by_region, x='region', y='revenue', ax=ax)
ax.set_title('Revenue by region'); ax.tick_params(axis='x', rotation=45)
fig.savefig('charts/by_region.png', dpi=150, bbox_inches='tight')
```

## 3. Assemble the Excel deliverable (openpyxl)

A summary sheet (styled header, number formats, a `SUM`, frozen header), a data sheet, and the charts embedded.

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils.dataframe import dataframe_to_rows
from openpyxl.drawing.image import Image as XLImage

wb = Workbook()
ws = wb.active; ws.title = 'Summary'

# styled header
ws.append(['Region', 'Revenue', 'Orders'])
for c in ws[1]:
    c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='305496')

# data rows + number format
for _, row in by_region.iterrows():
    ws.append([row['region'], float(row['revenue']), int(row['orders'])])
for cell in ws['B'][1:]:
    cell.number_format = '#,##0.00'

# total + polish
n = len(by_region)
ws[f'B{n+2}'] = f'=SUM(B2:B{n+1})'; ws[f'A{n+2}'] = 'Total'
ws.column_dimensions['A'].width = 16; ws.freeze_panes = 'A2'

# data sheet
ws2 = wb.create_sheet('Monthly')
for r in dataframe_to_rows(monthly, index=False, header=True):
    ws2.append(r)

# embed a chart image
ws3 = wb.create_sheet('Charts')
ws3.add_image(XLImage('charts/trend.png'), 'A1')

wb.save('report.xlsx')
```

## 4. The whole thing as a rerunnable script

```python
def build_report():
    con = duckdb.connect()
    by_region = con.sql(SQL_REGION).df()
    monthly   = con.sql(SQL_MONTHLY).df()
    make_charts(monthly, by_region)
    write_workbook(by_region, monthly)         # -> report.xlsx
    print('report.xlsx written')

if __name__ == '__main__':
    build_report()      # schedule this with cron/Prefect to refresh the report
```

## 5. Why this split

- **DuckDB for the math** — fast, reproducible, and SQL keeps complex analytics (windows, top-N, joins) readable.
  Crucially, you never pull millions of rows into pandas just to summarize them.
- **seaborn/matplotlib for the figures** — distributions to spot outliers, bars/lines for the story, saved crisp.
- **openpyxl for the deliverable** — stakeholders live in Excel; give them a formatted workbook, not a CSV dump.

## 6. Good habits

- Label axes and **units** honestly; pick the chart that fits the question (line=trend, bar=compare, hist=distribution).
- Keep the script **idempotent and rerunnable** so the report regenerates on demand or on a schedule.
- For huge data, let DuckDB stream it — the report only needs the small aggregated result, never the raw rows in memory.

## 7. Practice

1. Add a correlation heatmap of the numeric columns to the charts and embed it in the workbook.
2. Add a `QUALIFY` query for the bottom-3 products per region and put it on its own sheet.
3. Format the `delta`/`pct` columns with conditional coloring (red/green) using XlsxWriter.
4. Wrap `build_report()` in a Prefect flow scheduled every Monday at 7am.

This is the analyst-to-engineer last mile: correct numbers from SQL, a clear story in charts, and a polished workbook
the business can open — all in one short, scheduled script.
