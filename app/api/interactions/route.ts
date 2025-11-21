import { NextRequest, NextResponse } from 'next/server'
import { addInteraction, getInteractions, clearInteractions } from '@/lib/interactions-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    const interactions = getInteractions(userId || undefined)

    return NextResponse.json({
      interactions: interactions,
    })
  } catch (error) {
    console.error('Get interactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_id, 
      stage, 
      input, 
      output, 
      api_calls, 
      story,
      review,
      reviewType,
      bookTitle,
      bookCoverUrl,
      letter,
      recipient,
      occasion
    } = body

    if (!user_id || !stage) {
      return NextResponse.json(
        { error: 'user_id and stage are required' },
        { status: 400 }
      )
    }

    console.log('=== Saving Interaction ===')
    console.log('User ID:', user_id)
    console.log('Stage:', stage)
    console.log('Has review:', !!review)
    console.log('Review Type:', reviewType)
    console.log('Book Title:', bookTitle)
    console.log('Has bookCoverUrl:', !!bookCoverUrl)
    console.log('Has letter:', !!letter)
    console.log('========================')

    const interaction = addInteraction({
      user_id,
      stage,
      input: input || {},
      output: output || {},
      api_calls: api_calls || [],
      story: story || undefined,
      review: review || undefined,
      reviewType: reviewType || undefined,
      bookTitle: bookTitle || undefined,
      bookCoverUrl: bookCoverUrl || undefined,
      letter: letter || undefined,
      recipient: recipient || undefined,
      occasion: occasion || undefined,
    })

    console.log('Interaction saved:', {
      id: interaction.timestamp,
      stage: interaction.stage,
      hasReview: !!interaction.review,
      hasLetter: !!interaction.letter,
    })

    return NextResponse.json({
      success: true,
      interaction,
    })
  } catch (error) {
    console.error('Post interaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')

    // 验证教师密码
    if (password !== 'yinyin2948') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 清空所有交互记录
    clearInteractions()

    return NextResponse.json({
      success: true,
      message: 'All interactions cleared',
    })
  } catch (error) {
    console.error('Delete interactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

