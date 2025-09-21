#!/usr/bin/env crystal

require "option_parser"
require "file_utils"
require "colorize"

class CodeLinter
  @max_line_length : Int32 = 80
  @check_console_logs : Bool = true
  @check_todos : Bool = true
  @check_whitespace : Bool = true
  @check_indentation : Bool = true
  @recursive : Bool = false
  @extensions : Array(String) = [".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte"]
  
  @total_issues : Int32 = 0
  @total_files : Int32 = 0

  def initialize
    parse_options
  end

  def parse_options
    parser = OptionParser.parse do |parser|
      parser.banner = "Usage: crystal code-linter.cr [options] <files/directories>"
      
      parser.on("-l LENGTH", "--line-length=LENGTH", "Maximum line length (default: 80)") do |length|
        @max_line_length = length.to_i
      end
      
      parser.on("-r", "--recursive", "Scan directories recursively") do
        @recursive = true
      end
      
      parser.on("--no-console", "Skip console.log checks") do
        @check_console_logs = false
      end
      
      parser.on("--no-todos", "Skip TODO/FIXME checks") do
        @check_todos = false
      end
      
      parser.on("--no-whitespace", "Skip trailing whitespace checks") do
        @check_whitespace = false
      end
      
      parser.on("--no-indent", "Skip indentation checks") do
        @check_indentation = false
      end
      
      parser.on("-e EXT", "--ext=EXT", "Add file extension to check") do |ext|
        @extensions << ext unless @extensions.includes?(ext)
      end
      
      parser.on("-h", "--help", "Show help") do
        puts parser
        exit 0
      end
      
      parser.invalid_option do |flag|
        puts "ERROR: #{flag} is not a valid option.".colorize(:red)
        puts parser
        exit 1
      end
    end

    if ARGV.empty?
      puts "Error: No files or directories specified".colorize(:red)
      puts parser
      exit 1
    end
  end

  def run
    ARGV.each do |target|
      if File.file?(target)
        lint_file(target)
      elsif File.directory?(target)
        if @recursive
          scan_directory(target)
        else
          puts "Skipping directory '#{target}' (use -r for recursive)".colorize(:yellow)
        end
      else
        puts "Error: '#{target}' not found".colorize(:red)
      end
    end

    print_summary
  end

  private def scan_directory(dir_path : String)
    Dir.glob("#{dir_path}/**/*") do |file_path|
      next unless File.file?(file_path)
      next unless has_valid_extension?(file_path)
      lint_file(file_path)
    end
  end

  private def has_valid_extension?(file_path : String) : Bool
    @extensions.any? { |ext| file_path.ends_with?(ext) }
  end

  private def lint_file(file_path : String)
    return unless has_valid_extension?(file_path)
    
    begin
      content = File.read(file_path)
      lines = content.lines
      
      issues = [] of String
      has_tabs = false
      has_spaces = false
      
      lines.each_with_index do |line, index|
        line_num = index + 1
        
        # Check line length
        if line.size > @max_line_length
          issues << "Line #{line_num}: Line too long (#{line.size} > #{@max_line_length})"
        end
        
        # Check trailing whitespace
        if @check_whitespace && line.rstrip != line
          issues << "Line #{line_num}: Trailing whitespace"
        end
        
        # Check console.log statements
        if @check_console_logs && line.includes?("console.log")
          issues << "Line #{line_num}: console.log statement found"
        end
        
        # Check for TODO/FIXME comments
        if @check_todos
          if line.includes?("TODO") || line.includes?("FIXME") || line.includes?("XXX")
            comment_match = line.match(/(TODO|FIXME|XXX)[:\s](.*)/)
            if comment_match
              issues << "Line #{line_num}: #{comment_match[1]} comment: #{comment_match[2].strip}"
            else
              issues << "Line #{line_num}: #{line.includes?("TODO") ? "TODO" : line.includes?("FIXME") ? "FIXME" : "XXX"} comment"
            end
          end
        end
        
        # Check indentation consistency
        if @check_indentation && !line.strip.empty?
          leading_chars = line[0, line.size - line.lstrip.size]
          if leading_chars.includes?('\t')
            has_tabs = true
          end
          if leading_chars.includes?(' ')
            has_spaces = true
          end
        end
      end
      
      # Report mixed indentation
      if @check_indentation && has_tabs && has_spaces
        issues << "Mixed indentation: File uses both tabs and spaces"
      end
      
      if !issues.empty?
        @total_files += 1
        @total_issues += issues.size
        
        puts "\n#{file_path}".colorize(:blue).mode(:bold)
        puts "─" * 50
        
        issues.each do |issue|
          if issue.includes?("console.log")
            puts "  ⚠️  #{issue}".colorize(:yellow)
          elsif issue.includes?("TODO") || issue.includes?("FIXME") || issue.includes?("XXX")
            puts "  📝 #{issue}".colorize(:cyan)
          elsif issue.includes?("Line too long")
            puts "  📏 #{issue}".colorize(:magenta)
          elsif issue.includes?("whitespace")
            puts "  🧹 #{issue}".colorize(:light_red)
          elsif issue.includes?("indentation")
            puts "  🔤 #{issue}".colorize(:red)
          else
            puts "  ❌ #{issue}".colorize(:red)
          end
        end
        
        puts "Issues: #{issues.size}".colorize(:light_gray)
      end
      
    rescue ex
      puts "Error reading '#{file_path}': #{ex.message}".colorize(:red)
    end
  end

  private def print_summary
    puts "\n" + "=" * 60
    if @total_issues > 0
      puts "📊 SUMMARY: Found #{@total_issues} issues in #{@total_files} files".colorize(:red).mode(:bold)
      puts "\nIssue types checked:".colorize(:light_gray)
      puts "  📏 Line length (max: #{@max_line_length})" if @max_line_length > 0
      puts "  ⚠️  Console.log statements" if @check_console_logs
      puts "  📝 TODO/FIXME comments" if @check_todos
      puts "  🧹 Trailing whitespace" if @check_whitespace
      puts "  🔤 Mixed indentation" if @check_indentation
    else
      puts "✅ All files look good! No issues found.".colorize(:green).mode(:bold)
    end
  end
end

# Run the linter
linter = CodeLinter.new
linter.run
