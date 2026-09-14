from PIL import Image, ImageDraw, ImageFont
import os

width, height = 1200, 630
img = Image.new('RGB', (width, height), color='#FAF7F2')
draw = ImageDraw.Draw(img)

# Draw subtle dot grid
for x in range(20, width, 40):
    for y in range(20, height, 40):
        draw.ellipse([x-2, y-2, x+2, y+2], fill='#E8E2D8')

# Draw top sticker pill
pill_x0, pill_y0, pill_x1, pill_y1 = 430, 45, 770, 95
draw.rounded_rectangle([pill_x0+4, pill_y0+4, pill_x1+4, pill_y1+4], radius=25, fill='#1E1E24')
draw.rounded_rectangle([pill_x0, pill_y0, pill_x1, pill_y1], radius=25, fill='#FFEAA7', outline='#1E1E24', width=3)

# Fonts
try:
    font_large = ImageFont.truetype("arialbd.ttf", 64)
    font_sub = ImageFont.truetype("ariali.ttf", 26)
    font_pill = ImageFont.truetype("arialbd.ttf", 20)
    font_card_code = ImageFont.truetype("arialbd.ttf", 28)
    font_card_sub = ImageFont.truetype("arial.ttf", 15)
    font_bottom = ImageFont.truetype("arialbd.ttf", 18)
except:
    font_large = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_pill = ImageFont.load_default()
    font_card_code = ImageFont.load_default()
    font_card_sub = ImageFont.load_default()
    font_bottom = ImageFont.load_default()

# Pill text
draw.text((600, 70), "SEMESTER SURVIVAL KIT", fill='#1E1E24', font=font_pill, anchor="mm")

# Main Title & Subtitle
draw.text((600, 160), "THE STUDY VAULT", fill='#1E1E24', font=font_large, anchor="mm")
draw.text((600, 220), '"Because apparently we have to study."', fill='#636E72', font=font_sub, anchor="mm")

# Cards
cards = [
    {"code": "AIML", "sub": "Let's pretend\nwe prepared", "color": "#7C5CFC", "tint": "#EAE4FF", "x": 80},
    {"code": "GAI", "sub": "Prompting\nour way in", "color": "#FF6B6B", "tint": "#FFE5E5", "x": 295},
    {"code": "QCAI", "sub": "Superposition\nof passing", "color": "#00B894", "tint": "#DBF7EF", "x": 510},
    {"code": "CV", "sub": "GPA dropping\nin 4K UHD", "color": "#FD79A8", "tint": "#FFE8F1", "x": 725},
    {"code": "APS", "sub": "Probability > 0\nmaybe.", "color": "#FFA502", "tint": "#FFF3D6", "x": 940},
]

card_w, card_h = 180, 240
card_y = 280

for c in cards:
    cx = c["x"]
    # Shadow
    draw.rounded_rectangle([cx+5, card_y+5, cx+card_w+5, card_y+card_h+5], radius=20, fill='#1E1E24')
    # Card Body
    draw.rounded_rectangle([cx, card_y, cx+card_w, card_y+card_h], radius=20, fill=c["tint"], outline='#1E1E24', width=3)
    # Color top bar
    draw.rounded_rectangle([cx, card_y, cx+card_w, card_y+24], radius=20, fill=c["color"])
    draw.rectangle([cx, card_y+12, cx+card_w, card_y+24], fill=c["color"])
    
    # Title & Text
    draw.text((cx + card_w//2, card_y + 90), c["code"], fill='#1E1E24', font=font_card_code, anchor="mm")
    draw.text((cx + card_w//2, card_y + 160), c["sub"], fill='#4A4A52', font=font_card_sub, anchor="mm", align="center")
    
    # Tiny download pill at bottom
    draw.rounded_rectangle([cx + 25, card_y + 195, cx + card_w - 25, card_y + 225], radius=15, fill='#FFFFFF', outline='#1E1E24', width=2)
    draw.text((cx + card_w//2, card_y + 210), "Download", fill='#1E1E24', font=font_card_sub, anchor="mm")

# Bottom tagline
draw.text((600, 580), "5 SUBJECTS  *  0 EXCUSES  *  100% DIRECT DOWNLOADS", fill='#8C98A4', font=font_bottom, anchor="mm")

out_path = os.path.join(os.path.dirname(__file__), "public", "assets", "og-preview.png")
img.save(out_path, "PNG")
print("Saved og-preview.png successfully to", out_path)
