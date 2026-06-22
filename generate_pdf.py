#!/usr/bin/env python3
from fpdf import FPDF
import os
import sys

class PDF(FPDF):
    def __init__(self):
        super().__init__(orientation='L')  # 横向模式
        self.add_font('Chinese', '', '/Library/Fonts/Arial Unicode.ttf')
        
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font('Chinese', '', 10)
        self.cell(0, 10, f'第 {self.page_no()} 页', new_x='RIGHT', new_y='TOP', align='R')


def generate_pdf(md_file, pdf_file):
    pdf = PDF()
    pdf.add_page()
    pdf.set_font('Chinese', '', 10)
    
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    paragraphs = content.split('\n\n')
    
    for para in paragraphs:
        lines = para.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('# '):
                pdf.set_font('Chinese', '', 18)
                pdf.cell(0, 15, line[2:], new_x='LMARGIN', new_y='NEXT')
                pdf.ln(5)
            elif line.startswith('## '):
                pdf.set_font('Chinese', '', 14)
                pdf.set_text_color(0, 0, 255)
                pdf.cell(0, 12, line[3:], new_x='LMARGIN', new_y='NEXT')
                pdf.set_text_color(0, 0, 0)
                pdf.ln(3)
            elif line.startswith('### '):
                pdf.set_font('Chinese', '', 12)
                pdf.set_text_color(50, 50, 50)
                pdf.cell(0, 10, line[4:], new_x='LMARGIN', new_y='NEXT')
                pdf.set_text_color(0, 0, 0)
            elif line.startswith('|'):
                cells = [c.strip() for c in line.split('|')[1:-1]]
                row_text = ' | '.join(cells)
                pdf.set_font('Chinese', '', 9)
                pdf.cell(0, 8, row_text, new_x='LMARGIN', new_y='NEXT')
            elif line.startswith('- ') or line.startswith('* '):
                pdf.set_font('Chinese', '', 10)
                pdf.cell(0, 8, f'• {line[2:].replace("**", "")}', new_x='LMARGIN', new_y='NEXT')
            elif line.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')):
                pdf.set_font('Chinese', '', 10)
                pdf.cell(0, 8, line.replace('**', ''), new_x='LMARGIN', new_y='NEXT')
            elif line.strip() == '---':
                pdf.line(10, pdf.get_y(), pdf.w - 10, pdf.get_y())
                pdf.ln(5)
            else:
                pdf.set_font('Chinese', '', 10)
                text = line.replace('**', '')
                max_chars_per_line = 80
                while text:
                    pdf.cell(0, 8, text[:max_chars_per_line], new_x='LMARGIN', new_y='NEXT')
                    text = text[max_chars_per_line:]
    
    pdf.output(pdf_file)
    print(f"PDF文件已成功生成: {pdf_file}")


def generate_all_pdfs(directory='.'):
    md_files = [f for f in sorted(os.listdir(directory)) if f.endswith('.md')]
    if not md_files:
        print('未找到 Markdown 文件。')
        return
    for md_file in md_files:
        pdf_file = os.path.splitext(md_file)[0] + '.pdf'
        generate_pdf(os.path.join(directory, md_file), os.path.join(directory, pdf_file))


if __name__ == "__main__":
    if len(sys.argv) == 2:
        arg = sys.argv[1]
        if os.path.isdir(arg):
            generate_all_pdfs(arg)
        else:
            md_file = arg
            if os.path.exists(md_file):
                pdf_file = os.path.splitext(md_file)[0] + '.pdf'
                generate_pdf(md_file, pdf_file)
            else:
                print(f"错误：文件不存在: {md_file}")
    else:
        generate_all_pdfs('.')
