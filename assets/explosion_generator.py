from PIL import Image, ImageDraw

frames = []
size = 64
num_frames = 8

for i in range(num_frames):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int((i + 1) * (size / 2) / num_frames)
    alpha = int(255 * (1 - i / num_frames))
    color = (255, 165, 0, alpha)  # Orange with fading alpha
    draw.ellipse((size/2 - radius, size/2 - radius, size/2 + radius, size/2 + radius), fill=color)
    frames.append(img)

# Save frames
for idx, frame in enumerate(frames):
    frame.save(f'explosion_frame_{idx}.png')

print('Explosion frames generated.')
