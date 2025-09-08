// Random position generation (example canvas size 1920x1080)
const xPos = Math.random() * 1920;
const yPos = Math.random() * 1080;

const { data, error } = await supabase
  .from('pixelwall')
  .insert([
    {
      name,
      description: message,
      locked: false,
      xPos,
      yPos,
    },
  ])
  .select();
