import os
from PIL import Image

logo_path = 'public/img/logo-new.png'
public_dir = 'public'

def generate_icons():
    if not os.path.exists(logo_path):
        print(f"Error: {logo_path} not found.")
        return
        
    img = Image.open(logo_path)
    print(f"Loaded logo: {img.size}, format: {img.format}")
    
    # Ensure it's in RGBA
    img = img.convert('RGBA')
    
    # Create square canvas with transparent background
    w, h = img.size
    max_dim = max(w, h)
    square_img = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    square_img.paste(img, ((max_dim - w) // 2, (max_dim - h) // 2))
    
    # 1. Standard transparent icons
    icon_192 = square_img.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(os.path.join(public_dir, 'icon-192x192.png'), 'PNG')
    
    icon_512 = square_img.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join(public_dir, 'icon-512x512.png'), 'PNG')
    print("Generated standard icons in 192x192 and 512x512 dimensions.")
    
    # 2. Maskable icons (with white background and logo padded within a 60% safe zone)
    bg_color = (255, 255, 255, 255)
    
    # 192x192 Maskable
    maskable_192 = Image.new('RGBA', (192, 192), bg_color)
    logo_resized_192 = square_img.resize((115, 115), Image.Resampling.LANCZOS)
    maskable_192.paste(logo_resized_192, ((192 - 115) // 2, (192 - 115) // 2), logo_resized_192)
    maskable_192.save(os.path.join(public_dir, 'icon-192x192-maskable.png'), 'PNG')
    
    # 512x512 Maskable
    maskable_512 = Image.new('RGBA', (512, 512), bg_color)
    logo_resized_512 = square_img.resize((307, 307), Image.Resampling.LANCZOS)
    maskable_512.paste(logo_resized_512, ((512 - 307) // 2, (512 - 307) // 2), logo_resized_512)
    maskable_512.save(os.path.join(public_dir, 'icon-512x512-maskable.png'), 'PNG')
    print("Generated maskable icons in 192x192 and 512x512 dimensions.")

if __name__ == '__main__':
    generate_icons()
