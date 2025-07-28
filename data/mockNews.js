// Mock news data for testing when APIs are rate limited
const mockNewsData = {
  technology: [
    {
      title: "OpenAI Releases GPT-5 with Revolutionary AI Capabilities",
      description: "The new model demonstrates unprecedented understanding and reasoning abilities, marking a significant leap in artificial intelligence development.",
      url: "https://example.com/openai-gpt5",
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      source: "TechCrunch",
      author: "Sarah Johnson",
      publishedAt: new Date().toISOString(),
      content: "OpenAI has unveiled GPT-5, their most advanced language model to date. The new system shows remarkable improvements in reasoning, creativity, and understanding of complex contexts..."
    },
    {
      title: "Meta Unveils Next-Generation VR Headset",
      description: "The new headset promises ultra-realistic graphics and haptic feedback, bringing virtual reality closer to actual reality.",
      url: "https://example.com/meta-vr-headset",
      imageUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      source: "The Verge",
      author: "Alex Chen",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      content: "Meta's latest VR headset represents a significant advancement in virtual reality technology, featuring 8K resolution per eye and advanced haptic feedback systems..."
    }
  ],
  business: [
    {
      title: "Tesla Stock Surges After Record Quarterly Earnings",
      description: "Electric vehicle giant reports unprecedented profits driven by strong global demand and improved production efficiency.",
      url: "https://example.com/tesla-earnings",
      imageUrl: "https://images.unsplash.com/photo-1617886903355-9354bb57751f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      source: "Bloomberg",
      author: "Michael Davis",
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      content: "Tesla Inc. reported record quarterly earnings, exceeding analyst expectations by a significant margin. The company's revenue growth was driven by..."
    }
  ],
  science: [
    {
      title: "Scientists Discover New Form of Water Ice",
      description: "Researchers have identified a previously unknown crystalline structure of ice that could exist in extreme planetary conditions.",
      url: "https://example.com/water-ice-discovery",
      imageUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      source: "Nature",
      author: "Dr. Emma Wilson",
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      content: "An international team of scientists has discovered a new form of water ice with unique properties that could help explain the behavior of water on other planets..."
    }
  ],
  health: [
    {
      title: "Breakthrough Gene Therapy Shows Promise for Alzheimer's",
      description: "Clinical trials demonstrate significant improvement in memory and cognitive function for patients with early-stage Alzheimer's disease.",
      url: "https://example.com/alzheimers-gene-therapy",
      imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      source: "Medical Journal",
      author: "Dr. Robert Kim",
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      content: "A revolutionary gene therapy treatment has shown remarkable results in clinical trials for Alzheimer's disease, offering new hope for millions of patients worldwide..."
    }
  ]
};

module.exports = mockNewsData;
