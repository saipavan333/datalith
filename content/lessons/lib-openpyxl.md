# openpyxl & XlsxWriter — the complete guide

Excel is the format business stakeholders live in, so reading and producing `.xlsx` files is a regular data-engineering
chore. **openpyxl** reads *and* writes (and edits existing workbooks); **XlsxWriter** is write-only but excellent at
formatting and charts. This guide covers reading, writing, styling, formulas, charts, multi-sheet pandas exports, and
real scenarios.

## 1. The model

@@diagram:excel-workbook

A **Workbook** (`.xlsx` file) contains **Worksheets** (the tabs), each a grid of **Cells** addressed like `A1`, `B2`.
A cell holds a value, a formula, and styling. Install both engines:

```bash
pip install openpyxl xlsxwriter
```

## 2. Reading with openpyxl

```python
from openpyxl import load_workbook

wb = load_workbook('report.xlsx', data_only=True)  # data_only=True returns cached formula RESULTS
ws = wb['Sheet1']            # by name … or wb.active for the first sheet
wb.sheetnames                # ['Sheet1', 'Summary', ...]

ws['B2'].value               # a single cell
ws.cell(row=2, column=2).value   # same cell, by number (1-based)
ws.max_row, ws.max_column    # used range

# stream rows efficiently as tuples of values
for row in ws.iter_rows(min_row=2, values_only=True):
    name, amount = row[0], row[1]

# a column or row
for cell in ws['A']:         # whole column A
    print(cell.value)
```

> `data_only=True` reads the last value Excel **calculated** for a formula; without it you get the formula string.
> For large files, pass `read_only=True` to stream rows with low memory.

## 3. Writing with openpyxl

```python
from openpyxl import Workbook
wb = Workbook()
ws = wb.active; ws.title = 'Sales'

ws['A1'] = 'Region'                 # set a cell
ws.append(['North', 1200, 0.1])     # append a whole row (next empty row)
ws.cell(row=2, column=2, value=900) # set by number

ws['D2'] = '=B2*C2'                 # a formula (Excel computes it on open)
wb.create_sheet('Raw')              # add another sheet
wb.save('out.xlsx')
```

## 4. Styling (openpyxl)

```python
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

ws['A1'].font = Font(bold=True, size=12, color='FFFFFF')
ws['A1'].fill = PatternFill('solid', fgColor='305496')      # cell background
ws['A1'].alignment = Alignment(horizontal='center', vertical='center')
ws['B2'].number_format = '#,##0.00'                         # 1,234.56
ws['C2'].number_format = '0.0%'                             # percent
thin = Side(style='thin', color='BBBBBB')
ws['A1'].border = Border(left=thin, right=thin, top=thin, bottom=thin)

ws.column_dimensions['A'].width = 18        # column width
ws.row_dimensions[1].height = 22            # row height
ws.merge_cells('A1:C1')                      # merge a header across columns
ws.freeze_panes = 'A2'                       # freeze the header row when scrolling
```

## 5. Charts (openpyxl)

```python
from openpyxl.chart import BarChart, Reference
chart = BarChart(); chart.title = 'Revenue by region'
data = Reference(ws, min_col=2, min_row=1, max_row=5)
cats = Reference(ws, min_col=1, min_row=2, max_row=5)
chart.add_data(data, titles_from_data=True)
chart.set_categories(cats)
ws.add_chart(chart, 'E2')      # anchor at cell E2
```

## 6. pandas — the fast path for tables

For tabular data, let pandas drive these engines:

```python
import pandas as pd

# read
df = pd.read_excel('in.xlsx', sheet_name='Q1')      # one sheet (uses openpyxl)
sheets = pd.read_excel('in.xlsx', sheet_name=None)  # ALL sheets -> dict of DataFrames

# write multiple sheets in one file
with pd.ExcelWriter('out.xlsx', engine='xlsxwriter') as xl:
    df.to_excel(xl, sheet_name='data', index=False)
    df.groupby('region')['amount'].sum().to_excel(xl, sheet_name='by_region')
```

## 7. XlsxWriter — rich formatting on new files

XlsxWriter (write-only) shines for formatted reports. Through pandas you reach its workbook/worksheet objects:

```python
with pd.ExcelWriter('report.xlsx', engine='xlsxwriter') as xl:
    df.to_excel(xl, sheet_name='Sales', index=False)
    wb  = xl.book
    ws  = xl.sheets['Sales']
    money  = wb.add_format({'num_format': '$#,##0.00'})
    header = wb.add_format({'bold': True, 'bg_color': '#305496', 'font_color': 'white'})
    ws.set_column('C:C', 14, money)             # format a whole column
    ws.conditional_format('C2:C100', {'type': '3_color_scale'})
    for col, name in enumerate(df.columns):
        ws.write(0, col, name, header)          # styled header row
```

For huge writes, XlsxWriter's `{'constant_memory': True}` option streams rows to disk.

## 8. Scenario A — a formatted summary report

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

wb = Workbook(); ws = wb.active; ws.title = 'Summary'
ws.append(['Region', 'Revenue', 'Share'])
for c in ws[1]:
    c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='305496')

total = sum(r[1] for r in data)
for region, rev in data:
    ws.append([region, rev, rev/total])
ws['C2'].number_format = '0.0%'                 # (apply to the range as needed)
ws['B' + str(len(data)+2)] = f'=SUM(B2:B{len(data)+1})'
ws.column_dimensions['A'].width = 16; ws.freeze_panes = 'A2'
wb.save('summary.xlsx')
```

## 9. Scenario B — read a messy stakeholder spreadsheet

```python
# headers start on row 3, junk above; read with pandas
df = pd.read_excel('messy.xlsx', sheet_name='Data', skiprows=2)
df = df.dropna(how='all').rename(columns=str.strip)     # clean
df.to_parquet('clean.parquet')                          # move it into the pipeline
```

## 10. Gotchas

- A worksheet maxes out near **1,048,576 rows**; `.xlsx` is slow and memory-heavy at scale — use it for human-facing
  reports, not data interchange (prefer **Parquet/CSV** between systems).
- `data_only=True` needs the file to have been **saved by Excel** at least once (that's when results are cached).
- Cell addresses are **1-based** in openpyxl (`row=1` is the first row), unlike Python's 0-based indexing.
- openpyxl edits existing files; XlsxWriter cannot open them — pick the right engine for the job.

## 11. Practice

1. Read the `Q1` sheet of `book.xlsx` into a DataFrame, then read *all* sheets into a dict.
2. Create a workbook with a bold, colored header row and a `SUM` formula; save it.
3. Stream every row of a large sheet as tuples without loading styles.
4. Write three DataFrames to three sheets of one file, formatting a money column with XlsxWriter.

With these patterns you can both *consume* the spreadsheets colleagues send and *produce* polished Excel deliverables
on demand — while keeping Parquet/CSV for the machine-to-machine parts of your pipeline.
