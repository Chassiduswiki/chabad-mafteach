#!/usr/bin/env node

// Test script for OpenRouter API integration
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim();
      }
    });
  } catch (error) {
    console.error('Could not load .env.local file:', error.message);
  }
}

loadEnvFile();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('❌ Error: OPENROUTER_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('🔑 Testing OpenRouter API connection...');

// Initialize OpenRouter client
const openrouter = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: false
});

async function testConnection() {
  try {
    // Test with a simple translation request
    const response = await openrouter.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator specializing in Chassidic literature.'
        },
        {
          role: 'user',
          content: 'Translate this English text to Hebrew: "The concept of joy in Chassidic philosophy"'
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    const translation = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;
    
    console.log('✅ OpenRouter API connection successful!');
    console.log('📝 Test Translation:', translation);
    console.log('🔢 Tokens Used:', tokensUsed);
    console.log('🤖 Model Used:', response.model);
    
    // Test fallback model
    console.log('\n🔄 Testing fallback model...');
    const fallbackResponse = await openrouter.chat.completions.create({
      model: 'openai/gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from GPT-4 Turbo!"'
        }
      ],
      max_tokens: 50
    });
    
    console.log('✅ Fallback model working:', fallbackResponse.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ OpenRouter API test failed:', error.message);
    if (error.status) {
      console.error('Status Code:', error.status);
    }
    process.exit(1);
  }
}

// Test available models
async function testModels() {
  try {
    console.log('\n📋 Testing model availability...');
    
    const models = ['anthropic/claude-3.5-sonnet', 'openai/gpt-4-turbo', 'google/gemini-pro'];
    
    for (const model of models) {
      try {
        const response = await openrouter.chat.completions.create({
          model: model,
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        });
        console.log(`✅ ${model}: Available`);
      } catch (error) {
        console.log(`❌ ${model}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
  }
}

// Run tests
async function main() {
  await testConnection();
  await testModels();
  console.log('\n🎉 All tests completed successfully!');
}

main().catch(console.error);
