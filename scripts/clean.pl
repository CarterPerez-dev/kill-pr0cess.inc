#!/usr/bin/perl
use strict;
use warnings;
use File::Find;
use Getopt::Long;
use Term::ANSIColor qw(colored);

my $recursive = 0;
my $show_content = 0;
my $help = 0;
my @extensions = qw(.js .jsx .ts .tsx .css .scss .c .cpp .h .hpp .java .php);

GetOptions(
    'recursive|r'    => \$recursive,
    'content|c'      => \$show_content,
    'help|h'         => \$help,
    'ext=s'          => \@extensions
);

if ($help || @ARGV == 0) {
    show_help();
    exit 0;
}

my $total_comments = 0;
my $total_files = 0;

foreach my $target (@ARGV) {
    if (-f $target) {
        process_file($target);
    } elsif (-d $target && $recursive) {
        find(\&wanted, $target);
    } elsif (-d $target) {
        print colored("Skipping directory '$target' (use -r for recursive)\n", 'yellow');
    } else {
        print colored("Error: '$target' not found\n", 'red');
    }
}

print "\n" . "=" x 50 . "\n";
print colored("SUMMARY: Found $total_comments comments in $total_files files\n", 'bold green');

sub wanted {
    return unless -f $_;
    
    my $file = $_;
    my $has_valid_ext = 0;
    
    foreach my $ext (@extensions) {
        if ($file =~ /\Q$ext\E$/i) {
            $has_valid_ext = 1;
            last;
        }
    }
    
    return unless $has_valid_ext;
    
    process_file($File::Find::name);
}

sub process_file {
    my ($filepath) = @_;
    
    unless (open(my $fh, '<', $filepath)) {
        print colored("Error: Cannot open '$filepath': $!\n", 'red');
        return;
    }
    
    my @lines = <$fh>;
    close($fh);
    
    my $file_comments = 0;
    my $in_comment = 0;
    my $comment_start_line = 0;
    my $current_comment = "";
    
    for my $line_num (1..@lines) {
        my $line = $lines[$line_num - 1];
        chomp $line;
        
        if ($in_comment) {
            $current_comment .= $line;
            
            if ($line =~ /\*\//) {
                $in_comment = 0;
                $file_comments++;
                $total_comments++;
                
                print_comment_found($filepath, $comment_start_line, $line_num, $current_comment);
                $current_comment = "";
            }
            next;
        }
        
        my $pos = 0;
        while ($pos < length($line)) {
            my $start_pos = index($line, '/*', $pos);
            last if $start_pos == -1;
            
            my $end_pos = index($line, '*/', $start_pos + 2);
            
            if ($end_pos != -1) {
                my $comment_text = substr($line, $start_pos, $end_pos - $start_pos + 2);
                $file_comments++;
                $total_comments++;
                
                print_comment_found($filepath, $line_num, $line_num, $comment_text);
                $pos = $end_pos + 2;
            } else {
                $in_comment = 1;
                $comment_start_line = $line_num;
                $current_comment = substr($line, $start_pos);
                last;
            }
        }
    }
    
    if ($in_comment) {
        print colored("Warning: Unclosed comment starting at line $comment_start_line in '$filepath'\n", 'yellow');
        $file_comments++;
        $total_comments++;
    }
    
    if ($file_comments > 0) {
        $total_files++;
        print colored("\nFile: $filepath\n", 'bold blue');
        print colored("Comments found: $file_comments\n", 'green');
        print "-" x 40 . "\n";
    }
}

sub print_comment_found {
    my ($filepath, $start_line, $end_line, $comment) = @_;
    
    $comment =~ s/^\s+|\s+$//g;
    
    if ($start_line == $end_line) {
        print sprintf("  Line %d: ", $start_line);
    } else {
        print sprintf("  Lines %d-%d: ", $start_line, $end_line);
    }
    
    if ($show_content) {
        print colored($comment, 'cyan') . "\n";
    } else {
        my $preview = length($comment) > 50 ? substr($comment, 0, 47) . "..." : $comment;
        print colored($preview, 'cyan') . "\n";
    }
}

sub show_help {
    print <<'HELP';
Comment Linter - Find /* */ style comments in code files

USAGE:
    perl comment-linter.pl [OPTIONS] <files/directories>

OPTIONS:
    -r, --recursive     Recursively scan directories
    -c, --content       Show full comment content (default: preview)
    -h, --help          Show this help message
    --ext=.extension    Add file extension to scan (can be used multiple times)

EXAMPLES:
    perl comment-linter.pl src/app.js
    perl comment-linter.pl -r src/
    perl comment-linter.pl -r -c src/ public/
    perl comment-linter.pl --ext=.vue src/

DEFAULT EXTENSIONS:
    .js .jsx .ts .tsx .css .scss .c .cpp .h .hpp .java .php

HELP
}
