import * as dfd from "danfojs-node";
import OpenAI from "openai";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as fs from "fs";
import Papa from "papaparse";

// Initialize OpenAI with error handling
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here" 
});

interface BudgetData {
  Program: string;
  Service: string;
  Activity: string;
  "Expense/Revenue": string;
  "Category Name": string;
  "Sub-Category Name": string;
  "Commitment item": string;
  Amount: number;
  Year: number;
}

// Utility to flatten any array to 1D and filter for primitives
function flat1D<T>(arr: any): T[] {
  return Array.isArray(arr) ? arr.flat(Infinity).filter((v): v is T => typeof v !== 'object') : [];
}

async function loadData(): Promise<dfd.DataFrame> {
  try {
    const filePath = "toronto_budget_combined_2024_to_2019.csv";
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log("📊 Loading Toronto budget data...");
    const csvData = fs.readFileSync(filePath, "utf8");
    
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Handle manually for better control
      transform: (value: string, field: string) => {
        // Clean and convert Amount field - remove quotes and commas
        if (field === "Amount") {
          const cleaned = value.replace(/["',]/g, '').replace(/[^\d.-]/g, '');
          return cleaned ? parseFloat(cleaned) : 0;
        }
        // Convert Year field
        if (field === "Year") {
          const year = parseInt(value, 10);
          return isNaN(year) ? null : year;
        }
        // Clean other string fields
        return value?.replace(/^"|"$/g, '').trim() || '';
      }
    });

    if (parsed.errors.length > 0) {
      console.warn("⚠️ CSV parsing warnings:", parsed.errors.slice(0, 3));
    }

    // Filter out rows with invalid years
    const validData = parsed.data.filter((row: any) => 
      row.Year && !isNaN(row.Year) && row.Year >= 2019 && row.Year <= 2024
    );

    console.log(`📈 Loaded ${validData.length} valid records`);
    
    const df = new dfd.DataFrame(validData);
    
    // Print data summary
    const years = [...new Set(flat1D<number|string|boolean>(df.column("Year").values))].sort();
    const services = [...new Set(flat1D<string>(df.column("Service").values))];
    const programs = [...new Set(flat1D<string>(df.column("Program").values))];
    
    console.log("✅ Data loaded successfully");
    console.log(`📅 Available years: ${years.join(', ')}`);
    console.log(`🏛️ Number of services: ${services.length}`);
    console.log(`📋 Number of programs: ${programs.length}`);
    
    return df;
    
  } catch (error: any) {
    console.error("❌ Error loading data:", error.message);
    process.exit(1);
  }
}

function getYearlyExpenses(df: dfd.DataFrame, year: number): string {
  try {
    // Filter for specific year and expenses only
    const yearMask = df.column("Year").values.map((v: any) => v === year);
    const expenseMask = df.column("Expense/Revenue").values.map((v: any) => v === "Expenses");
    const combinedMask = yearMask.map((v, i) => v && expenseMask[i]);
    
    const yearData = df.loc({ rows: combinedMask });
    
    if (yearData.shape[0] === 0) {
      const availableYears = [...new Set(flat1D<number|string|boolean>(df.column("Year").values))].sort();
      return `❌ No expense data found for ${year}. Available years: ${availableYears.join(', ')}`;
    }

    const totalExpenses = yearData.column("Amount").sum();
    const recordCount = yearData.shape[0];
    
    // Get top 5 services by expense amount
    const serviceGroups = yearData.groupby(["Service"]).col(["Amount"]).sum();
    const sortedServices = serviceGroups.sortValues("Amount_sum", { ascending: false });
    const topServices = sortedServices.head(5);
    
    let response = `💰 ${year} Total Expenses: $${totalExpenses.toLocaleString('en-CA')}\n`;
    response += `📊 Based on ${recordCount} expense records\n\n`;
    response += `🏆 Top 5 Services by Expense:\n`;
    
    // Extract top services data
    const serviceNames = topServices.column("Service").values;
    const serviceAmounts = topServices.column("Amount_sum").values;
    
    for (let i = 0; i < Math.min(5, serviceNames.length); i++) {
      response += `${i + 1}. ${serviceNames[i]}: $${serviceAmounts[i].toLocaleString('en-CA')}\n`;
    }
    
    return response;
    
  } catch (error: any) {
    console.error("Error in getYearlyExpenses:", error);
    return `❌ Error calculating ${year} expenses: ${error.message}`;
  }
}

function analyzeHydroTrend(df: dfd.DataFrame): string {
  try {
    // Filter for Hydro in Sub-Category Name (based on your sample data)
    const hydroMask = df.column("Sub-Category Name").values.map((v: any) => v === "Hydro");
    const expenseMask = df.column("Expense/Revenue").values.map((v: any) => v === "Expenses");
    const combinedMask = hydroMask.map((v, i) => v && expenseMask[i]);
    
    const hydroData = df.loc({ rows: combinedMask });
    
    if (hydroData.shape[0] === 0) {
      // Look for any energy-related categories
      const energyMask = df.column("Category Name").values.map((v: any) => v === "Energy");
      const energyExpenseMask = df.column("Expense/Revenue").values.map((v: any) => v === "Expenses");
      const combinedEnergyMask = energyMask.map((v, i) => v && energyExpenseMask[i]);
      const energyData = df.loc({ rows: combinedEnergyMask });
      
      if (energyData.shape[0] === 0) {
        return "❌ No Hydro or Energy data found in the dataset.";
      }
      
      // Show available energy subcategories
      const energySubcats = [...new Set(flat1D<string>(energyData.column("Sub-Category Name").values))];
      return `No specific Hydro data found. Available energy subcategories: ${energySubcats.join(', ')}`;
    }

    // Group by year and sum amounts
    const yearlyHydro = hydroData.groupby(["Year"]).col(["Amount"]).sum();
    const sortedHydro = yearlyHydro.sortValues("Year");
    
    const years = flat1D<number|string|boolean>(sortedHydro.column("Year").values);
    const amounts = flat1D<number>(sortedHydro.column("Amount_sum").values);
    
    let response = `⚡ Hydro Costs Trend:\n`;
    
    for (let i = 0; i < years.length; i++) {
      response += `${years[i]}: ${amounts[i].toLocaleString('en-CA')}\n`;
    }
    
    // Calculate overall change
    if (amounts.length > 1) {
      const firstAmount = Number(amounts[0]);
      const lastAmount = Number(amounts[amounts.length - 1]);
      const change = lastAmount - firstAmount;
      const percentChange = firstAmount !== 0 ? ((change / firstAmount) * 100).toFixed(1) : "N/A";
      
      response += `\n📊 Change from ${years[0]} to ${years[years.length - 1]}: `;
      response += `${change.toLocaleString('en-CA')} (${percentChange}%)`;
    }
    
    return response;
    
  } catch (error: any) {
    console.error("Error in analyzeHydroTrend:", error);
    return `❌ Error analyzing Hydro trends: ${error.message}`;
  }
}

function analyzeTrend(df: dfd.DataFrame, category: string): string {
  try {
    // Try matching sub-category first (more specific)
    const subcatSeries = df.column("Sub-Category Name");
    let filtered = df.loc({ rows: flat1D<string>(subcatSeries.values).map(v => typeof v === 'string' && v.toLowerCase().includes(category.toLowerCase())) });
    
    // If no results, try category name
    if (filtered.shape[0] === 0) {
      const catSeries = df.column("Category Name");
      filtered = df.loc({ rows: flat1D<string>(catSeries.values).map(v => typeof v === 'string' && v.toLowerCase().includes(category.toLowerCase())) });
    }

    if (filtered.shape[0] === 0) {
      const subcatStrings = flat1D<string>(df.column("Sub-Category Name").values);
      const subcats = Array.from(new Set(subcatStrings)).slice(0,5).join(', ');
      return `No data found for ${category}. Try one of these: ${subcats}`;
    }

    const grouped = filtered.groupby(["Year"]).col(["Amount"]).sum();
    const years = flat1D<number|string|boolean>(grouped.column("Year").values);
    const amounts = flat1D<number>(grouped.column("Amount_sum").values);
    
    // Sort by year
    const trendData = years.map((year, i) => ({ year: Number(year), amount: Number(amounts[i]) }))
      .sort((a, b) => a.year - b.year);

    let response = `${category} Cost Trends:\n`;
    trendData.forEach(item => {
      response += `- ${item.year}: $${item.amount.toLocaleString('en-CA')}\n`;
    });

    // Calculate overall change if multiple years
    if (trendData.length > 1) {
      const first = trendData[0].amount;
      const last = trendData[trendData.length-1].amount;
      const change = last - first;
      const pctChange = first !== 0 ? ((change)/first * 100).toFixed(1) : "N/A";
      
      response += `\nOverall change: $${change.toLocaleString('en-CA')} (${pctChange}%) ` +
                 `from ${trendData[0].year} to ${trendData[trendData.length-1].year}`;
    }

    return response;
  } catch (error) {
    console.error("Trend analysis error:", error);
    return `I couldn't analyze the trend for ${category}. Please try a different category.`;
  }
}

function getDataSummary(df: dfd.DataFrame): string {
  try {
    const years = [...new Set(flat1D<number|string|boolean>(df.column("Year").values))].sort();
    const services = [...new Set(flat1D<string>(df.column("Service").values))];
    const programs = [...new Set(flat1D<string>(df.column("Program").values))];
    const totalRecords = df.shape[0];
    const totalAmount = df.column("Amount").sum();
    
    // Get latest year summary
    const latestYear = Math.max(...years.filter(y => typeof y === 'number') as number[]);
    const latestYearMask = df.column("Year").values.map((v: any) => v === latestYear);
    const latestYearData = df.loc({ rows: latestYearMask });
    const latestYearTotal = latestYearData.column("Amount").sum();
    
    // Get top 3 programs by total amount
    const programTotals = df.groupby(["Program"]).col(["Amount"]).sum();
    const topPrograms = programTotals.sortValues("Amount_sum", { ascending: false }).head(3);
    
    return `
📊 Toronto Budget Data Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Years: ${years.join(', ')}
🏛️ Programs: ${programs.length} total
📋 Services: ${services.length} total  
📈 Total Records: ${totalRecords.toLocaleString()}
💰 Overall Total: ${totalAmount.toLocaleString('en-CA')}
🎯 ${latestYear} Total: ${latestYearTotal.toLocaleString('en-CA')}

🏆 Top 3 Programs by Total Amount:
${topPrograms.column("Program").values.map((prog, i) => 
  `• ${prog}: ${topPrograms.column("Amount_sum").values[i].toLocaleString('en-CA')}`
).join('\n')}

💡 Try asking:
• "What were the expenses in 2023?"
• "Show me hydro trends"
• "What does Arena Boards of Management spend on?"
• "Compare natural gas vs hydro costs"
`;
    
  } catch (error: any) {
    console.error("Error in getDataSummary:", error);
    return "❌ Error generating data summary";
  }
}

async function askQuestion(df: dfd.DataFrame, question: string): Promise<string> {
  try {
    const cleanQuestion = question.toLowerCase().trim();
    
    // Handle specific patterns
    
    // Year-specific expenses
    const yearMatch = question.match(/(20\d{2})/);
    if (yearMatch && (cleanQuestion.includes('expense') || cleanQuestion.includes('cost'))) {
      const year = parseInt(yearMatch[1]);
      return getYearlyExpenses(df, year);
    }
    
    // Trend analysis - handle specific categories from your data
    if (cleanQuestion.includes('trend') || cleanQuestion.includes('change')) {
      if (cleanQuestion.includes('hydro')) {
        return analyzeHydroTrend(df);
      } else if (cleanQuestion.includes('natural gas') || cleanQuestion.includes('gas')) {
        return analyzeTrend(df, 'Natural Gas');
      } else if (cleanQuestion.includes('water')) {
        return analyzeTrend(df, 'Water');
      } else {
        // Look for other trend terms
        const trendTerms = ['equipment', 'benefits', 'salaries', 'energy'];
        const foundTerm = trendTerms.find(term => cleanQuestion.includes(term));
        if (foundTerm) {
          return analyzeTrend(df, foundTerm);
        }
      }
    }
    
    // General data overview
    if (cleanQuestion.includes('tell me') || cleanQuestion.includes('overview') || cleanQuestion.includes('summary')) {
      return getDataSummary(df);
    }
    
    // Fallback to OpenAI for complex questions
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your-api-key-here") {
      const context = buildDataContext(df);
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // More cost-effective model
        messages: [
          {
            role: "system",
            content: `You analyze Toronto budget data. Context:\n${context}\n
Rules:
1. Always verify against the actual data
2. For expenses, check "Expense/Revenue" column  
3. Amounts are in Canadian dollars
4. Be specific about data limitations
5. Provide actionable insights`
          },
          { role: "user", content: question }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || "I couldn't generate a response.";
    } else {
      return `🤖 I can help with specific queries like:
• "What were the expenses in [year]?"
• "Show me [category] trends"
• "Give me a data summary"

For more complex analysis, please set your OPENAI_API_KEY environment variable.`;
    }
    
  } catch (error: any) {
    console.error("Question processing error:", error);
    return `❌ Error processing question: ${error.message}`;
  }
}

function buildDataContext(df: dfd.DataFrame): string {
  const years = [...new Set(flat1D<number|string|boolean>(df.column("Year").values))].sort();
  const services = [...new Set(flat1D<string>(df.column("Service").values))];
  const programs = [...new Set(flat1D<string>(df.column("Program").values))];
  const categories = [...new Set(flat1D<string>(df.column("Category Name").values))];
  
  return `
Toronto Budget Data Context:
- Years Available: ${years.join(', ')}
- Total Records: ${df.shape[0].toLocaleString()}
- Programs (${programs.length}): ${programs.slice(0, 6).join(', ')}${programs.length > 6 ? '...' : ''}  
- Services (${services.length}): ${services.slice(0, 6).join(', ')}${services.length > 6 ? '...' : ''}
- Categories (${categories.length}): ${categories.slice(0, 6).join(', ')}${categories.length > 6 ? '...' : ''}
- Data structure: Program, Service, Activity, Expense/Revenue, Category Name, Sub-Category Name, Commitment item, Amount, Year
- Common subcategories: Hydro, Natural Gas, Water, Benefits, Salaries, Equipment
`;
}

async function main() {
  console.log("🏛️ Toronto Budget Analysis Tool");
  console.log("================================\n");
  
  const df = await loadData();
  const rl = readline.createInterface({ input, output });

  console.log("\n💬 Ready for your questions!");
  console.log("Type 'help' for examples, 'exit' to quit\n");

  while (true) {
    try {
      const question = await rl.question("You: ");
      
      if (question.toLowerCase() === "exit") {
        console.log("👋 Goodbye!");
        rl.close();
        break;
      }
      
      if (question.toLowerCase() === "help") {
        console.log(`
💡 Example Questions:
• "What were the expenses in 2023?"
• "Show me hydro trends" 
• "Tell me about the data"
• "Show me natural gas costs over time"
• "What does Arena Boards of Management spend on?"
• "Compare hydro vs natural gas trends"
`);
        continue;
      }

      if (!question.trim()) {
        console.log("❓ Please ask a question about the budget data.");
        continue;
      }

      console.log("\n🔍 Analyzing...");
      const answer = await askQuestion(df, question);
      console.log(`\n🤖 ${answer}\n`);
      
    } catch (error: any) {
      console.error("❌ Error:", error.message);
      console.log("Please try again.\n");
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});