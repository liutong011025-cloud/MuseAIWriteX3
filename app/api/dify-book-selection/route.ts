import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

// ============================================
// Book Selection 专用配置 - 不要修改！
// ============================================
// 这个路由必须使用 app-EnHszR7uaCnOh1EWb7INdemd
// 绝对不要使用 app-TFDykrjN8LpJROY6eTRNjwo5 (那是 plot brainstorm 用的)

// 直接在代码中配置 API Key（不依赖环境变量）
const DIFY_BOOK_SELECTION_API_KEY = 'app-EnHszR7uaCnOh1EWb7INdemd'

// 硬编码 APP_ID，确保不会被错误覆盖
const DIFY_BOOK_SELECTION_APP_ID = 'app-EnHszR7uaCnOh1EWb7INdemd' as const
const DIFY_BASE_URL = 'https://api.dify.ai/v1'

export async function POST(request: NextRequest) {
  try {
    const { reviewType, bookTitle, conversation, conversation_id, user_id } = await request.json()

    if (!reviewType || !bookTitle) {
      return NextResponse.json(
        { error: 'Review type and book title are required' },
        { status: 400 }
      )
    }

    if (!DIFY_BOOK_SELECTION_API_KEY) {
      console.error('DIFY_BOOK_SELECTION_API_KEY not configured')
      return NextResponse.json(
        { error: 'DIFY_BOOK_SELECTION_API_KEY not configured' },
        { status: 500 }
      )
    }

    // 构建查询消息，包含review类型和书名
    const queryMessage = `The student wants to write a ${reviewType} review for the book: ${bookTitle}. Please help them select this book and guide them. When appropriate, you can say "Let's start writing" to indicate they can proceed.`

    // Dify API configuration
    const url = `${DIFY_BASE_URL}/chat-messages`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIFY_BOOK_SELECTION_API_KEY}`,
    }
    
    // ============================================
    // 强制使用正确的 APP_ID - 绝对不要修改！
    // ============================================
    const appId: string = 'app-EnHszR7uaCnOh1EWb7INdemd'
    
    // 验证 APP_ID 是否正确
    if (appId !== 'app-EnHszR7uaCnOh1EWb7INdemd') {
      console.error('CRITICAL ERROR: APP_ID is incorrect!', appId)
      return NextResponse.json(
        { error: 'Internal configuration error: Wrong APP_ID' },
        { status: 500 }
      )
    }
    
    // 为 book-selection 使用独立的 user_id，避免与其他功能混淆
    const bookSelectionUserId = `book-selection-${user_id || 'default-user'}-${reviewType}`
    
    // 构建请求体 - 强制使用正确的 app_id
    const requestBody = {
      inputs: {
        review_type: reviewType,
        book_title: bookTitle,
      },
      query: queryMessage,
      response_mode: 'blocking' as const,
      conversation_id: undefined, // 不使用 conversation_id，创建新对话
      user: bookSelectionUserId,
      app_id: appId, // 强制使用 app-EnHszR7uaCnOh1EWb7INdemd
    }

    // ============================================
    // 详细日志和验证
    // ============================================
    console.log('=== Dify Book Selection API Request ===')
    console.log('ROUTE: /api/dify-book-selection')
    console.log('APP_ID (必须为 app-EnHszR7uaCnOh1EWb7INdemd):', appId)
    console.log('APP_ID 验证:', appId === 'app-EnHszR7uaCnOh1EWb7INdemd' ? '✓ 正确' : '✗ 错误！')
    console.log('User ID:', bookSelectionUserId)
    console.log('URL:', url)
    console.log('Request Body app_id:', requestBody.app_id)
    console.log('Full Request Body:', JSON.stringify(requestBody, null, 2))
    console.log('Review Type:', reviewType)
    console.log('Book Title:', bookTitle)
    console.log('========================================')

    // 多重验证：确保 app_id 正确
    if (requestBody.app_id !== 'app-EnHszR7uaCnOh1EWb7INdemd') {
      console.error('CRITICAL ERROR: APP_ID mismatch in requestBody!', {
        expected: 'app-EnHszR7uaCnOh1EWb7INdemd',
        actual: requestBody.app_id,
        appId: appId,
        DIFY_BOOK_SELECTION_APP_ID: DIFY_BOOK_SELECTION_APP_ID
      })
      return NextResponse.json(
        { error: 'Internal error: APP_ID configuration mismatch. Expected app-EnHszR7uaCnOh1EWb7INdemd' },
        { status: 500 }
      )
    }
    
    // 再次验证：确保不是错误的机器人
    if (requestBody.app_id === 'app-TFDykrjN8LpJROY6eTRNjwo5') {
      console.error('CRITICAL ERROR: Using wrong robot (plot brainstorm)!')
      return NextResponse.json(
        { error: 'Internal error: Wrong robot detected. This should not happen!' },
        { status: 500 }
      )
    }

    // 发送请求前最后一次验证
    const requestBodyString = JSON.stringify(requestBody)
    if (requestBodyString.includes('app-TFDykrjN8LpJROY6eTRNjwo5')) {
      console.error('CRITICAL ERROR: Request body contains wrong APP_ID!')
      console.error('Request Body:', requestBodyString)
      return NextResponse.json(
        { error: 'Internal error: Request contains wrong APP_ID' },
        { status: 500 }
      )
    }
    
    console.log('Sending request to Dify API...')
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: requestBodyString,
    })
    
    console.log('=== Dify API Response ===')
    console.log('Status:', response.status, response.statusText)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    console.log('========================')

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API error:', errorText)
      return NextResponse.json(
        { error: `Dify API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    const message = data.answer || data.message || ''

    // 记录API调用
    await logApiCall(
      bookSelectionUserId,
      'bookSelection',
      '/api/dify-book-selection',
      { reviewType, bookTitle, conversation_id: 'new-conversation' },
      { answer: message, conversation_id: data.conversation_id, message_id: data.id }
    )

    return NextResponse.json({
      message,
      conversationId: data.conversation_id,
      messageId: data.id,
    })
  } catch (error) {
    console.error('Book selection API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

