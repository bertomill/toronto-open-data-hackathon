# Toronto Open Data Hackathon - Budget Analysis

This repository contains processed Toronto budget data for 2019-2024 and tools for data manipulation.

## Files

### Data
- `toronto_budget_combined_2024_to_2019.csv` - Combined budget data from all years (2024-2019) stacked vertically
  - Total rows: 112,762
  - Order: 2024 data at top, down to 2019 at bottom
  - All columns properly aligned across years

### Scripts
- `append_budget_data_csv.py` - Working script using Python's CSV module to combine budget files
- `append_budget_data.py` - Alternative script using pandas (requires compatible NumPy version)

## Data Structure

All files contain the following columns:
1. Program
2. Service  
3. Activity
4. Expense/Revenue
5. Category Name
6. Sub-Category Name
7. Commitment item
8. Amount
9. Year

## Data Processing Notes

- Fixed header corruption in 2020 budget file (missing "Program" column name)
- All files now have consistent column structure
- Data stacked chronologically from 2024 (top) to 2019 (bottom)

## Usage

To recreate the combined dataset:
```bash
python append_budget_data_csv.py
```

## Data Summary by Year
- 2024: 18,585 rows
- 2023: 20,128 rows  
- 2022: 19,715 rows
- 2021: 17,127 rows
- 2020: 17,779 rows
- 2019: 19,428 rows 