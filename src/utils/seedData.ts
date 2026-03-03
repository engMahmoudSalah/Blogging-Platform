import { v4 as uuidv4 } from 'uuid';
import { Post } from '../types';
import { calculateReadingTime } from './readingTime';

const defaultAuthor = {
  name: 'Chase',
  avatar: 'https://picsum.photos/seed/chase/150/150',
  bio: 'AI Automation expert and founder of Chase AI.'
};

export const seedPosts: Post[] = [
  {
    id: uuidv4(),
    title: 'The Future of AI Agencies: How to Build and Scale in 2025',
    content: `
      <p>The landscape of service-based businesses is undergoing a seismic shift. AI agencies are no longer just a trend; they are becoming the backbone of modern business operations. In this post, we'll explore how to build and scale an AI agency from the ground up.</p>
      <h2>Why AI Agencies?</h2>
      <p>Traditional agencies are often bogged down by manual processes. AI agencies leverage automation to deliver results faster, cheaper, and with higher precision. This isn't just about using ChatGPT; it's about building custom workflows that solve real business problems.</p>
      <blockquote>"The biggest opportunity in the next decade lies in the intersection of AI and specialized service delivery."</blockquote>
      <h3>Key Pillars of a Successful AI Agency:</h3>
      <ul>
        <li><strong>Niche Focus:</strong> Don't try to be everything to everyone. Focus on a specific industry like Real Estate or E-commerce.</li>
        <li><strong>Custom Workflows:</strong> Build proprietary systems using tools like Make.com, LangChain, and Pinecone.</li>
        <li><strong>Value-Based Pricing:</strong> Charge for the results you deliver, not the hours you work.</li>
      </ul>
      <p>Scaling requires moving from custom one-off projects to standardized productized services. By building a library of reusable AI components, you can significantly increase your margins while maintaining high quality.</p>
    `,
    tags: ['AI Agency', 'Business', 'Scaling'],
    readingTime: 6,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200',
    author: defaultAuthor,
    likes: 245,
    views: 1520,
    featured: true
  },
  {
    id: uuidv4(),
    title: 'Building a Multi-Agent System for Content Creation',
    content: `
      <p>Content is king, but creating it consistently is a challenge. Multi-agent systems allow you to automate the entire content lifecycle, from research to distribution.</p>
      <h2>The Agentic Approach</h2>
      <p>Instead of one large prompt, we use multiple specialized agents that collaborate. For example, one agent researches the topic, another writes the draft, and a third agent performs SEO optimization.</p>
      <h3>Tools of the Trade:</h3>
      <ul>
        <li><strong>CrewAI:</strong> For orchestrating role-playing agents.</li>
        <li><strong>AutoGPT:</strong> For autonomous task execution.</li>
        <li><strong>GPT-4o:</strong> As the reasoning engine for all agents.</li>
      </ul>
      <p>By implementing this system, we've seen a 70% reduction in content production time while increasing engagement rates by 40%.</p>
    `,
    tags: ['AI Agents', 'Automation', 'Content'],
    readingTime: 8,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    coverImage: 'https://images.unsplash.com/photo-1684369175833-0a498877680b?auto=format&fit=crop&q=80&w=1200',
    author: defaultAuthor,
    likes: 189,
    views: 2800,
    featured: false
  },
  {
    id: uuidv4(),
    title: 'How to Automate Customer Support with LLMs and Vector Databases',
    content: `
      <p>Customer support is often the most expensive department in a company. AI can handle up to 80% of common queries, allowing your human team to focus on complex issues.</p>
      <h2>RAG: Retrieval-Augmented Generation</h2>
      <p>The secret to accurate AI support is RAG. By connecting your LLM to a vector database containing your company's documentation, you ensure the AI provides factual, up-to-date information.</p>
      <p>This approach eliminates hallucinations and builds trust with your customers. We recommend using Pinecone or Weaviate for your vector storage needs.</p>
    `,
    tags: ['Customer Support', 'LLMs', 'RAG'],
    readingTime: 5,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    coverImage: 'https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&q=80&w=1200',
    author: defaultAuthor,
    likes: 156,
    views: 1200,
    featured: false
  }
];
