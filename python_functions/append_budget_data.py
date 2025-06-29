import pandas as pd
import os

def append_toronto_budget_files():
    """
    Append Toronto budget CSV files vertically in chronological order (2024 to 2019).
    
    Returns:
        pandas.DataFrame: Combined dataframe with all years stacked vertically
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
    
    # List to store individual dataframes
    dataframes = []
    
    # Read each file and append to list
    for file in budget_files:
        if os.path.exists(file):
            print(f"Reading {file}...")
            df = pd.read_csv(file)
            print(f"  - Shape: {df.shape}")
            print(f"  - Year column unique values: {df['Year'].unique()}")
            dataframes.append(df)
        else:
            print(f"Warning: {file} not found!")
    
    # Concatenate all dataframes vertically
    if dataframes:
        combined_df = pd.concat(dataframes, ignore_index=True)
        print(f"\nCombined dataset shape: {combined_df.shape}")
        print(f"Years in combined dataset: {sorted(combined_df['Year'].unique(), reverse=True)}")
        
        # Display basic info about the combined dataset
        print(f"\nColumn names:")
        for i, col in enumerate(combined_df.columns, 1):
            print(f"  {i}. {col}")
            
        return combined_df
    else:
        print("No files were successfully loaded!")
        return None

def save_combined_data(df, output_filename="toronto_budget_combined_2024_to_2019.csv"):
    """
    Save the combined dataframe to a CSV file.
    
    Args:
        df (pandas.DataFrame): Combined dataframe
        output_filename (str): Output filename
    """
    if df is not None:
        df.to_csv(output_filename, index=False)
        print(f"\nCombined data saved to: {output_filename}")
        print(f"Total rows: {len(df):,}")
        print(f"Total columns: {len(df.columns)}")
    else:
        print("No data to save!")

# Main execution
if __name__ == "__main__":
    print("=== Toronto Budget Data Append Tool ===\n")
    
    # Append the files
    combined_data = append_toronto_budget_files()
    
    # Save the combined data
    if combined_data is not None:
        save_combined_data(combined_data)
        
        # Show a sample of the data
        print("\n=== Sample of Combined Data ===")
        print(combined_data.head(10))
        
        print("\n=== Data Summary by Year ===")
        year_counts = combined_data['Year'].value_counts().sort_index(ascending=False)
        for year, count in year_counts.items():
            print(f"  {year}: {count:,} rows")
    else:
        print("Failed to create combined dataset.") 