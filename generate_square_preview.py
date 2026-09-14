from PIL import Image, ImageDraw, ImageFont
import os

size = 400
img = Image.new('RGB', (size, size), color='#FAF7F2')
draw = ImageDraw.Draw(img)

# Dots
for x in range(15, size, 25):
    for y in range(15, size, 25):
        draw.ellipse([x-1, y-1, x+1, y+1], fill='#E8E2D8')

# Box
draw.rounded_rectangle([30, 30, 370, 370], radius=28, fill='#FFEAA7', outline='#1E1E24', width=4)

try:
    font_title = ImageFont.truetype("arialbd.ttf", 34)
    font_sub = ImageFont.truetype("arialbd.ttf", 16)
    font_body = ImageFont.truetype("arial.ttf", 14)
except:
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_body = ImageFont.load_default()

# Book icon representation or text
draw.text((200, 100), "📚", font=font_title, anchor="mm")
draw.text((200, 165), "THE STUDY", fill='#1E1E24', font=font_title, anchor="mm")
draw.text((200, 205), "VAULT", fill='#7C5CFC', font=font_title, anchor="mm")

# Pill
draw.rounded_rectangle([60, 245, 340, 285], radius=20, fill='#FFFFFF', outline='#1E1E24', width=2)
draw.text((200, 265), "AIML * GAI * QCAI * CV * APS", fill='#1E1E24', font=font_sub, anchor="mm")

# Tagline
draw.text((200, 325), "Because apparently we have to study.", fill='#636E72', font=font_body, anchor="mm")

out_path = os.path.join(os.path.dirname(__file__), "public", "assets", "og-preview-square.png")
img.save(out_path, "PNG")
print("Saved og-preview-square.png successfully to", out_path)
