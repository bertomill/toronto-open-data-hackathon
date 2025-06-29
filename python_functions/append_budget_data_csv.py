
import csv
import os

def append_toronto_budget_files_csv():
    """
    Append Toronto budget CSV files vertically in chronological order (2024 to 2019)
    using built-in CSV module to avoid pandas/numpy issues.
    """
    
    # Define the files in the order you want (2024 at top, then 2023, 2022, 2021, 2020, 2019)
    budget_files = [
        "Toronto Hackathon - City Budget 2024.csv",
        "Toronto Hackathon - City Budget 2023.csv", 
        "Toronto Hackathon - City Budget 2022.csv",
        "Toronto Hackathon - City Budget 2021.csv",
        "Toronto Hackathon - City Budget 2020.csv",
        "Toronto Hackathon - City Budget 2019.csv"
    ]
    
    output_file = "toronto_budget_combined_2024_to_2019.csv"
    
    # Variables to track progress
    total_rows = 0
    header_written = False
    year_counts = {}
    
    print("=== Toronto Budget Data Append Tool (CSV Module) ===\n")
    
    with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = None
        
        for file_index, filename in enumerate(budget_files):
            if os.path.exists(filename):
                print(f"Processing {filename}...")
                
                with open(filename, 'r', encoding='utf-8') as infile:
                    reader = csv.reader(infile)
                    
                    # Read header
                    header = next(reader)
                    
                    # Write header only once (from first file)
                    if not header_written:
                        writer = csv.writer(outfile)
                        writer.writerow(header)
                        header_written = True
                        print(f"  - Header columns: {header}")
                    
                    # Process data rows
                    file_row_count = 0
                    for row in reader:
                        writer.writerow(row)
                        file_row_count += 1
                        total_rows += 1
                        
                        # Track year counts (assuming Year is the last column)
                        if len(row) >= len(header):
                            year = row[-1]  # Last column should be Year
                            year_counts[year] = year_counts.get(year, 0) + 1
                    
                    print(f"  - Rows added: {file_row_count:,}")
            else:
                print(f"Warning: {filename} not found!")
    
    print(f"\n=== Results ===")
    print(f"Combined data saved to: {output_file}")
    print(f"Total rows: {total_rows:,}")
    
    print(f"\n=== Data Summary by Year ===")
    for year in sorted(year_counts.keys(), reverse=True):
        print(f"  {year}: {year_counts[year]:,} rows")
    
    return output_file

def preview_combined_file(filename, num_rows=10):
    """
    Preview the first few rows of the combined file.
    """
    print(f"\n=== Preview of {filename} (first {num_rows} rows) ===")
    
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            
            # Read and print header
            header = next(reader)
            print("Header:")
            for i, col in enumerate(header, 1):
                print(f"  {i}. {col}")
            
            print(f"\nFirst {num_rows} data rows:")
            for i, row in enumerate(reader):
                if i >= num_rows:
                    break
                print(f"  Row {i+1}: {row}")
    else:
        print(f"File {filename} not found!")

# Main execution
if __name__ == "__main__":
    # Append the files
    output_filename = append_toronto_budget_files_csv()
    
    # Preview the results
    preview_combined_file(output_filename) 