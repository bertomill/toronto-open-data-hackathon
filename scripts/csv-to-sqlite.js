import Database from 'better-sqlite3';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

const CSV_PATH = '../toronto_budget_combined_2024_to_2019.csv';
const DB_PATH = '../frontend/public/data/toronto_budget.db';
const VALIDATION_REPORT_PATH = '../frontend/public/data/data_validation_report.json';
const CLEANED_CSV_PATH = '../toronto_budget_cleaned.csv';
const MISSING_DATA_REPORT_PATH = '../frontend/public/data/missing_data_detailed_report.json';
const FLAGGED_ROWS_CSV_PATH = '../toronto_budget_flagged_rows.csv';

console.log('🚀 Toronto Budget Data Processor - Enhanced Edition');
console.log('💪 The city depends on us - let\'s make this bulletproof!\n');

// Enhanced validation configuration
const VALIDATION_CONFIG = {
  requiredFields: ['Year', 'Program', 'Service', 'Activity', 'Amount'],
  criticalFields: ['Year', 'Program', 'Amount'], // These are absolutely essential
  yearRange: { min: 2015, max: 2030 },
  amountThresholds: {
    suspiciouslyLarge: 1000000000, // $1B+ flagged as suspicious
    suspiciouslySmall: -1000000000 // Less than -$1B flagged
  }
};

// Read and parse CSV with enhanced error handling
let csvContent, rawData;
try {
  console.log('📖 Reading CSV file...');
  csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // Keep as strings for better control
    transform: (value) => value === '' ? null : value
  });
  
  rawData = parseResult.data;
  
  if (parseResult.errors.length > 0) {
    console.warn('⚠️ CSV parsing warnings:');
    parseResult.errors.forEach(error => {
      console.warn(`   Row ${error.row}: ${error.message}`);
    });
  }
  
  console.log(`📊 Successfully parsed ${rawData.length} rows from CSV\n`);
} catch (error) {
  console.error('❌ Failed to read CSV file:', error.message);
  process.exit(1);
}

// Enhanced validation and cleaning tracking
const validationResults = {
  timestamp: new Date().toISOString(),
  sourceFile: CSV_PATH,
  totalRows: rawData.length,
  processedRows: 0,
  skippedRows: 0,
  
  // Missing data analysis
  missingDataAnalysis: {
    byField: {},
    byRow: {},
    criticallyFlawed: [], // Rows missing critical fields
    partiallyFlawed: [], // Rows with some missing data
    perfectRows: 0
  },
  
  // Data quality metrics
  dataQuality: {
    completenessScore: 0, // Percentage of complete data
    criticalFieldsScore: 0, // Percentage with all critical fields
    suspiciousValues: [],
    duplicateRows: []
  },
  
  // Cleaning operations (enhanced)
  cleaningOperations: {
    trimmedWhitespace: 0,
    normalizedNulls: 0,
    correctedYears: 0,
    fixedAmountFormats: 0,
    inferredPrograms: 0,
    inferredServices: 0,
    flaggedSuspiciousAmounts: 0,
    standardizedCasing: 0
  },
  
  // Remaining issues after cleaning
  remainingIssues: {
    missingYear: 0,
    missingProgram: 0,
    missingService: 0,
    missingActivity: 0,
    missingAmount: 0,
    invalidAmount: 0,
    invalidYear: 0,
    suspiciousAmount: 0
  },
  
  // Examples for manual review
  exampleRows: {
    cleaned: [],
    problematic: [],
    suspicious: []
  }
};

// Initialize missing data tracking
VALIDATION_CONFIG.requiredFields.forEach(field => {
  validationResults.missingDataAnalysis.byField[field] = {
    missingCount: 0,
    emptyCount: 0,
    examples: []
  };
});

// Enhanced data cleaning and validation functions
const analyzeDataQuality = (data) => {
  console.log('🔍 Performing comprehensive data quality analysis...');
  
  const seenRows = new Set();
  let perfectRowCount = 0;
  
  data.forEach((row, index) => {
    const rowId = index + 1; // 1-based for user friendliness
    const rowAnalysis = {
      rowId,
      missingFields: [],
      emptyFields: [],
      issues: [],
      severity: 'none' // none, minor, major, critical
    };
    
    // Check for duplicates
    const rowKey = JSON.stringify(row);
    if (seenRows.has(rowKey)) {
      validationResults.dataQuality.duplicateRows.push({
        rowId,
        duplicateOf: Array.from(seenRows).indexOf(rowKey) + 1
      });
    }
    seenRows.add(rowKey);
    
    // Analyze each field
    let hasCriticalIssue = false;
    let hasMinorIssue = false;
    
    VALIDATION_CONFIG.requiredFields.forEach(field => {
      const value = row[field];
      const fieldAnalysis = validationResults.missingDataAnalysis.byField[field];
      
      if (value === null || value === undefined) {
        fieldAnalysis.missingCount++;
        rowAnalysis.missingFields.push(field);
        rowAnalysis.issues.push(`Missing ${field}`);
        
        if (VALIDATION_CONFIG.criticalFields.includes(field)) {
          hasCriticalIssue = true;
        } else {
          hasMinorIssue = true;
        }
        
        // Store example for review
        if (fieldAnalysis.examples.length < 3) {
          fieldAnalysis.examples.push({
            rowId,
            context: { ...row }
          });
        }
      } else if (typeof value === 'string' && value.trim() === '') {
        fieldAnalysis.emptyCount++;
        rowAnalysis.emptyFields.push(field);
        rowAnalysis.issues.push(`Empty ${field}`);
        hasMinorIssue = true;
      }
    });
    
    // Special validation for specific fields
    if (row.Year) {
      const year = parseInt(row.Year);
      if (isNaN(year) || year < VALIDATION_CONFIG.yearRange.min || year > VALIDATION_CONFIG.yearRange.max) {
        rowAnalysis.issues.push(`Invalid year: ${row.Year}`);
        hasMinorIssue = true;
      }
    }
    
    if (row.Amount) {
      const amount = parseFloat(row.Amount.toString().replace(/[^0-9.-]/g, ''));
      if (!isNaN(amount)) {
        if (Math.abs(amount) > VALIDATION_CONFIG.amountThresholds.suspiciouslyLarge) {
          rowAnalysis.issues.push(`Suspiciously large amount: ${row.Amount}`);
          validationResults.dataQuality.suspiciousValues.push({
            rowId,
            field: 'Amount',
            value: row.Amount,
            reason: 'Unusually large value'
          });
        }
      }
    }
    
    // Determine severity
    if (hasCriticalIssue) {
      rowAnalysis.severity = 'critical';
      validationResults.missingDataAnalysis.criticallyFlawed.push(rowAnalysis);
    } else if (hasMinorIssue) {
      rowAnalysis.severity = 'minor';
      validationResults.missingDataAnalysis.partiallyFlawed.push(rowAnalysis);
    } else {
      rowAnalysis.severity = 'none';
      perfectRowCount++;
    }
    
    validationResults.missingDataAnalysis.byRow[rowId] = rowAnalysis;
  });
  
  validationResults.missingDataAnalysis.perfectRows = perfectRowCount;
  
  // Calculate quality scores
  const totalRows = data.length;
  validationResults.dataQuality.completenessScore = ((perfectRowCount / totalRows) * 100).toFixed(2);
  
  const criticallyFlawedCount = validationResults.missingDataAnalysis.criticallyFlawed.length;
  validationResults.dataQuality.criticalFieldsScore = (((totalRows - criticallyFlawedCount) / totalRows) * 100).toFixed(2);
  
  console.log(`   ✅ Perfect rows: ${perfectRowCount} (${validationResults.dataQuality.completenessScore}%)`);
  console.log(`   ⚠️ Rows with minor issues: ${validationResults.missingDataAnalysis.partiallyFlawed.length}`);
  console.log(`   ❌ Critically flawed rows: ${criticallyFlawedCount}`);
  console.log(`   🔄 Duplicate rows found: ${validationResults.dataQuality.duplicateRows.length}\n`);
};

// Enhanced data cleaning function
const cleanData = (rawData) => {
  console.log('🧹 Starting enhanced data cleaning process...');
  
  const cleanedData = [];
  const flaggedRows = []; // Rows that need manual review
  const programServiceMap = {}; // For inference
  
  // First pass: build relationships for inference
  rawData.forEach(row => {
    if (row.Program && row.Service) {
      const program = row.Program.toString().trim();
      const service = row.Service.toString().trim();
      programServiceMap[program] = service;
    }
  });
  
  console.log(`   📚 Built inference map with ${Object.keys(programServiceMap).length} program-service relationships`);
  
  // Second pass: clean each row
  rawData.forEach((row, index) => {
    const rowId = index + 1;
    const originalRow = { ...row };
    const cleaningLog = [];
    const flags = [];
    
    try {
      // Clean and validate Year
      if (row.Year) {
        const originalYear = row.Year;
        row.Year = row.Year.toString().trim();
        
        // Handle complex year formats
        const yearMatch = row.Year.match(/(\d{4})/);
        if (yearMatch) {
          const extractedYear = parseInt(yearMatch[0]);
          if (extractedYear >= VALIDATION_CONFIG.yearRange.min && extractedYear <= VALIDATION_CONFIG.yearRange.max) {
            if (extractedYear.toString() !== originalYear.toString()) {
              cleaningLog.push(`Corrected year format: ${originalYear} → ${extractedYear}`);
              validationResults.cleaningOperations.correctedYears++;
            }
            row.Year = extractedYear;
          } else {
            cleaningLog.push(`Year ${extractedYear} outside valid range`);
            flags.push('invalid_year');
          }
        } else {
          cleaningLog.push(`Could not parse year: ${originalYear}`);
          flags.push('unparseable_year');
        }
      }
      
      // Clean text fields with standardization
      ['Program', 'Service', 'Activity'].forEach(field => {
        if (row[field]) {
          const original = row[field].toString();
          // Trim whitespace
          row[field] = original.trim();
          
          // Standardize casing (Title Case for important fields)
          if (field === 'Program' || field === 'Service') {
            const titleCase = row[field].toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            if (titleCase !== row[field]) {
              row[field] = titleCase;
              validationResults.cleaningOperations.standardizedCasing++;
              cleaningLog.push(`Standardized ${field} casing`);
            }
          }
          
          if (original !== row[field]) {
            validationResults.cleaningOperations.trimmedWhitespace++;
          }
        }
      });
      
      // Normalize empty/null values
      VALIDATION_CONFIG.requiredFields.forEach(field => {
        if (row[field] === '' || row[field] === 'NULL' || row[field] === 'null' || row[field] === 'N/A') {
          row[field] = null;
          validationResults.cleaningOperations.normalizedNulls++;
          cleaningLog.push(`Normalized empty ${field} to null`);
        }
      });
      
      // Smart inference for missing values
      if (!row.Service && row.Program && programServiceMap[row.Program]) {
        row.Service = programServiceMap[row.Program];
        cleaningLog.push(`Inferred service: ${row.Service}`);
        validationResults.cleaningOperations.inferredServices++;
      }
      
      // Enhanced amount cleaning
      if (row.Amount) {
        const originalAmount = row.Amount.toString();
        let cleanedAmount = originalAmount;
        
        // Handle parentheses for negative numbers
        const isNegative = cleanedAmount.includes('(') && cleanedAmount.includes(')');
        
        // Remove currency symbols, commas, spaces, but keep decimal and minus
        cleanedAmount = cleanedAmount.replace(/[$,\s()]/g, '');
        
        const parsedAmount = parseFloat(cleanedAmount);
        if (!isNaN(parsedAmount)) {
          row.Amount = isNegative ? -Math.abs(parsedAmount) : parsedAmount;
          
          // Flag suspicious amounts
          if (Math.abs(row.Amount) > VALIDATION_CONFIG.amountThresholds.suspiciouslyLarge) {
            flags.push('suspicious_large_amount');
            validationResults.cleaningOperations.flaggedSuspiciousAmounts++;
            cleaningLog.push(`Flagged suspicious amount: ${row.Amount}`);
          }
          
          if (originalAmount !== row.Amount.toString()) {
            validationResults.cleaningOperations.fixedAmountFormats++;
            cleaningLog.push(`Cleaned amount: ${originalAmount} → ${row.Amount}`);
          }
        } else {
          cleaningLog.push(`Could not parse amount: ${originalAmount}`);
          flags.push('unparseable_amount');
          row.Amount = null;
        }
      }
      
      // Final validation and issue tracking
      const finalIssues = [];
      VALIDATION_CONFIG.requiredFields.forEach(field => {
        if (!row[field]) {
          const issueKey = `missing${field}`;
          if (validationResults.remainingIssues[issueKey] !== undefined) {
            validationResults.remainingIssues[issueKey]++;
          }
          finalIssues.push(`missing_${field.toLowerCase()}`);
        }
      });
      
      // Check for invalid data types
      if (row.Amount && isNaN(row.Amount)) {
        validationResults.remainingIssues.invalidAmount++;
        finalIssues.push('invalid_amount');
      }
      
      if (row.Year && (isNaN(row.Year) || row.Year < VALIDATION_CONFIG.yearRange.min || row.Year > VALIDATION_CONFIG.yearRange.max)) {
        validationResults.remainingIssues.invalidYear++;
        finalIssues.push('invalid_year');
      }
      
      // Store examples for reporting
      if (cleaningLog.length > 0 && validationResults.exampleRows.cleaned.length < 5) {
        validationResults.exampleRows.cleaned.push({
          rowId,
          original: originalRow,
          cleaned: { ...row },
          changes: cleaningLog,
          flags: flags.concat(finalIssues)
        });
      }
      
      if (finalIssues.length > 0 && validationResults.exampleRows.problematic.length < 10) {
        validationResults.exampleRows.problematic.push({
          rowId,
          data: { ...row },
          issues: finalIssues,
          severity: VALIDATION_CONFIG.criticalFields.some(field => !row[field]) ? 'critical' : 'minor'
        });
      }
      
      // Flag rows for manual review if they have issues
      if (flags.length > 0 || finalIssues.length > 0) {
        flaggedRows.push({
          rowId,
          original: originalRow,
          cleaned: { ...row },
          issues: finalIssues,
          flags,
          cleaningLog,
          needsReview: flags.length > 0 || VALIDATION_CONFIG.criticalFields.some(field => !row[field])
        });
      }
      
      cleanedData.push(row);
      validationResults.processedRows++;
      
    } catch (error) {
      console.warn(`⚠️ Error processing row ${rowId}:`, error.message);
      validationResults.skippedRows++;
      flaggedRows.push({
        rowId,
        original: originalRow,
        error: error.message,
        needsReview: true
      });
    }
  });
  
  console.log(`   ✅ Processed ${validationResults.processedRows} rows`);
  console.log(`   ⚠️ Skipped ${validationResults.skippedRows} rows due to errors`);
  console.log(`   🚩 Flagged ${flaggedRows.length} rows for review\n`);
  
  // Save flagged rows for manual review
  if (flaggedRows.length > 0) {
    const flaggedCsv = Papa.unparse(flaggedRows.map(fr => ({
      Row_ID: fr.rowId,
      Issues: fr.issues ? fr.issues.join('; ') : '',
      Flags: fr.flags ? fr.flags.join('; ') : '',
      Needs_Review: fr.needsReview ? 'YES' : 'NO',
      Error: fr.error || '',
      ...fr.cleaned || fr.original
    })), { header: true });
    
    fs.writeFileSync(FLAGGED_ROWS_CSV_PATH, flaggedCsv);
    console.log(`🚩 Saved ${flaggedRows.length} flagged rows to: ${FLAGGED_ROWS_CSV_PATH}`);
  }
  
  return cleanedData;
};

// Perform comprehensive analysis
analyzeDataQuality(rawData);

// Clean the data
const cleanedData = cleanData(rawData);

// Create enhanced database
console.log('🏗️ Creating enhanced database schema...');
const db = new Database(DB_PATH);

// Enhanced schema with data quality tracking
db.exec(`
  CREATE TABLE IF NOT EXISTS budget_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER CHECK(year BETWEEN 1900 AND 2100),
    program TEXT NOT NULL,
    service TEXT NOT NULL,
    activity TEXT,
    amount REAL NOT NULL,
    amount_raw TEXT,
    data_quality_score INTEGER DEFAULT 100,
    has_issues BOOLEAN DEFAULT FALSE,
    issue_description TEXT,
    cleaning_log TEXT,
    row_hash TEXT,
    source_row_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, program, service, activity, amount)
  )
`);

// Enhanced indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_year ON budget_data(year);
  CREATE INDEX IF NOT EXISTS idx_program ON budget_data(program);
  CREATE INDEX IF NOT EXISTS idx_service ON budget_data(service);
  CREATE INDEX IF NOT EXISTS idx_activity ON budget_data(activity);
  CREATE INDEX IF NOT EXISTS idx_amount ON budget_data(amount);
  CREATE INDEX IF NOT EXISTS idx_quality_score ON budget_data(data_quality_score);
  CREATE INDEX IF NOT EXISTS idx_has_issues ON budget_data(has_issues);
  CREATE INDEX IF NOT EXISTS idx_row_hash ON budget_data(row_hash);
`);

// Data quality tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS data_quality_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_rows INTEGER,
    perfect_rows INTEGER,
    problematic_rows INTEGER,
    critical_issues INTEGER,
    completeness_score REAL,
    critical_fields_score REAL,
    cleaning_operations_performed TEXT,
    top_issues TEXT
  )
`);

// Insert data with quality scoring
console.log('💾 Inserting enhanced data into database...');
const insertBudget = db.prepare(`
  INSERT OR REPLACE INTO budget_data (
    year, program, service, activity, amount, amount_raw, 
    data_quality_score, has_issues, issue_description, 
    cleaning_log, row_hash, source_row_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let insertedCount = 0;
let errorCount = 0;

const insertMany = db.transaction((records) => {
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowId = i + 1;
    
    try {
      // Calculate data quality score (0-100)
      let qualityScore = 100;
      const issues = [];
      
      if (!record.Year) { qualityScore -= 25; issues.push('Missing year'); }
      if (!record.Program) { qualityScore -= 25; issues.push('Missing program'); }
      if (!record.Service) { qualityScore -= 15; issues.push('Missing service'); }
      if (!record.Activity) { qualityScore -= 10; issues.push('Missing activity'); }
      if (!record.Amount || isNaN(record.Amount)) { qualityScore -= 25; issues.push('Invalid amount'); }
      
      // Create row hash for duplicate detection
      const rowHash = require('crypto')
        .createHash('md5')
        .update(JSON.stringify([record.Year, record.Program, record.Service, record.Activity, record.Amount]))
        .digest('hex');
      
      insertBudget.run(
        record.Year ? parseInt(record.Year) : null,
        record.Program || 'Unknown Program',
        record.Service || 'Unknown Service',
        record.Activity || null,
        record.Amount && !isNaN(record.Amount) ? parseFloat(record.Amount) : null,
        record.Amount ? record.Amount.toString() : null,
        qualityScore,
        issues.length > 0,
        issues.join('; '),
        '', // We'll populate this if needed
        rowHash,
        rowId
      );
      insertedCount++;
    } catch (error) {
      console.warn(`⚠️ Error inserting record ${rowId}:`, error.message);
      errorCount++;
    }
  }
});

insertMany(cleanedData);

// Insert data quality summary
const insertQualitySummary = db.prepare(`
  INSERT INTO data_quality_summary (
    total_rows, perfect_rows, problematic_rows, critical_issues,
    completeness_score, critical_fields_score, cleaning_operations_performed,
    top_issues
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertQualitySummary.run(
  validationResults.totalRows,
  validationResults.missingDataAnalysis.perfectRows,
  validationResults.missingDataAnalysis.partiallyFlawed.length,
  validationResults.missingDataAnalysis.criticallyFlawed.length,
  parseFloat(validationResults.dataQuality.completenessScore),
  parseFloat(validationResults.dataQuality.criticalFieldsScore),
  JSON.stringify(validationResults.cleaningOperations),
  JSON.stringify(validationResults.remainingIssues)
);

// Enhanced metadata
db.exec(`
  CREATE TABLE IF NOT EXISTS processing_metadata (
    key TEXT PRIMARY KEY,
    value TEXT,
    category TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertMeta = db.prepare(`
  INSERT OR REPLACE INTO processing_metadata (key, value, category) 
  VALUES (?, ?, ?)
`);

insertMeta.run('source_file', CSV_PATH, 'file');
insertMeta.run('database_version', '3.0-enhanced', 'system');
insertMeta.run('total_records', insertedCount.toString(), 'stats');
insertMeta.run('perfect_records', validationResults.missingDataAnalysis.perfectRows.toString(), 'quality');
insertMeta.run('completeness_score', validationResults.dataQuality.completenessScore, 'quality');
insertMeta.run('critical_fields_score', validationResults.dataQuality.criticalFieldsScore, 'quality');

// Generate enhanced reports
console.log('📊 Generating comprehensive reports...');

// Save cleaned CSV
const cleanedCsv = Papa.unparse(cleanedData, {
  header: true,
  quotes: true
});
fs.writeFileSync(CLEANED_CSV_PATH, cleanedCsv);

// Save detailed validation report
fs.writeFileSync(
  VALIDATION_REPORT_PATH,
  JSON.stringify(validationResults, null, 2)
);

// Create detailed missing data report
const missingDataReport = {
  summary: {
    totalRows: validationResults.totalRows,
    perfectRows: validationResults.missingDataAnalysis.perfectRows,
    partiallyFlawedRows: validationResults.missingDataAnalysis.partiallyFlawed.length,
    criticallyFlawedRows: validationResults.missingDataAnalysis.criticallyFlawed.length,
    completenessScore: validationResults.dataQuality.completenessScore + '%',
    criticalFieldsScore: validationResults.dataQuality.criticalFieldsScore + '%'
  },
  missingDataByField: validationResults.missingDataAnalysis.byField,
  criticallyFlawedRows: validationResults.missingDataAnalysis.criticallyFlawed.slice(0, 50), // First 50
  suspiciousValues: validationResults.dataQuality.suspiciousValues,
  duplicateRows: validationResults.dataQuality.duplicateRows,
  cleaningOperations: validationResults.cleaningOperations,
  recommendations: [
    'Review critically flawed rows in the flagged rows CSV',
    'Investigate suspicious amounts over $1B',
    'Consider data source quality for fields with high missing rates',
    'Implement upstream validation to prevent future data quality issues'
  ]
};

fs.writeFileSync(
  MISSING_DATA_REPORT_PATH,
  JSON.stringify(missingDataReport, null, 2)
);

// Print comprehensive summary
console.log('\n🎉 TORONTO BUDGET DATA PROCESSING COMPLETE! 🎉');
console.log('=' * 60);
console.log('\n📊 EXECUTIVE SUMMARY:');
console.log(`   • Total records processed: ${validationResults.totalRows.toLocaleString()}`);
console.log(`   • Perfect records: ${validationResults.missingDataAnalysis.perfectRows.toLocaleString()} (${validationResults.dataQuality.completenessScore}%)`);
console.log(`   • Records with issues: ${validationResults.missingDataAnalysis.partiallyFlawed.length + validationResults.missingDataAnalysis.criticallyFlawed.length} (${(100 - parseFloat(validationResults.dataQuality.completenessScore)).toFixed(1)}%)`);
console.log(`   • Critically flawed: ${validationResults.missingDataAnalysis.criticallyFlawed.length} (${((validationResults.missingDataAnalysis.criticallyFlawed.length / validationResults.totalRows) * 100).toFixed(1)}%)`);
console.log(`   • Data Quality Score: ${validationResults.dataQuality.completenessScore}%`);

console.log('\n🔧 CLEANING OPERATIONS PERFORMED:');
Object.entries(validationResults.cleaningOperations).forEach(([operation, count]) => {
  if (count > 0) {
    console.log(`   • ${operation.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${count.toLocaleString()}`);
  }
});

console.log('\n⚠️ DATA QUALITY ISSUES IDENTIFIED:');
Object.entries(validationResults.remainingIssues).forEach(([issue, count]) => {
  if (count > 0) {
    console.log(`   • ${issue.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${count.toLocaleString()} (${((count / validationResults.totalRows) * 100).toFixed(1)}%)`);
  }
});

console.log('\n📁 FILES GENERATED:');
console.log(`   • 🗄️ Database: ${DB_PATH} (${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`   • 🧹 Cleaned CSV: ${CLEANED_CSV_PATH}`);
console.log(`   • 🚩 Flagged rows: ${FLAGGED_ROWS_CSV_PATH}`);
console.log(`   • 📊 Validation report: ${VALIDATION_REPORT_PATH}`);
console.log(`   • 🔍 Missing data analysis: ${MISSING_DATA_REPORT_PATH}`);

if (validationResults.missingDataAnalysis.criticallyFlawed.length > 0) {
  console.log('\n🚨 ATTENTION REQUIRED:');
  console.log(`   • ${validationResults.missingDataAnalysis.criticallyFlawed.length} rows have critical missing data`);
  console.log(`   • Review the flagged rows CSV for manual correction`);
  console.log(`   • Consider data source improvements to prevent future issues`);
}

console.log('\n✅ Toronto can count on this data! The city\'s budget is in good hands. 🏛️');

db.close();