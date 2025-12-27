import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('should forward ref correctly', () => {
      const ref = vi.fn()
      render(<Input ref={ref} />)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('Input Types', () => {
    it('should render as textbox by default', () => {
      render(<Input />)
      // Input without type attribute defaults to text in browsers
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should render email input', () => {
      render(<Input type="email" />)
      const input = document.querySelector('input[type="email"]')
      expect(input).toBeInTheDocument()
    })

    it('should render password input', () => {
      render(<Input type="password" />)
      const input = document.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
    })

    it('should render number input', () => {
      render(<Input type="number" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
    })
  })

  describe('Value handling', () => {
    it('should display value', () => {
      render(<Input value="test value" readOnly />)
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument()
    })

    it('should handle onChange events', () => {
      const onChange = vi.fn()
      render(<Input onChange={onChange} />)
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } })
      expect(onChange).toHaveBeenCalled()
    })

    it('should handle user typing', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Input onChange={onChange} />)

      await user.type(screen.getByRole('textbox'), 'hello')
      expect(onChange).toHaveBeenCalledTimes(5) // Once per character
    })
  })

  describe('Disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('should not accept input when disabled', async () => {
      const onChange = vi.fn()
      render(<Input disabled onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'test')

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should apply disabled styles', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toHaveClass('disabled:opacity-50')
    })
  })

  describe('Custom className', () => {
    it('should merge custom className', () => {
      render(<Input className="custom-class" />)
      expect(screen.getByRole('textbox')).toHaveClass('custom-class')
    })

    it('should keep default classes with custom className', () => {
      render(<Input className="custom-class" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('rounded-md')
      expect(input).toHaveClass('custom-class')
    })
  })

  describe('HTML attributes', () => {
    it('should pass name attribute', () => {
      render(<Input name="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email')
    })

    it('should pass id attribute', () => {
      render(<Input id="email-input" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-input')
    })

    it('should pass required attribute', () => {
      render(<Input required />)
      expect(screen.getByRole('textbox')).toBeRequired()
    })

    it('should pass maxLength attribute', () => {
      render(<Input maxLength={100} />)
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '100')
    })

    it('should pass aria-label attribute', () => {
      render(<Input aria-label="Email address" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Email address')
    })
  })

  describe('Focus handling', () => {
    it('should handle onFocus', () => {
      const onFocus = vi.fn()
      render(<Input onFocus={onFocus} />)
      fireEvent.focus(screen.getByRole('textbox'))
      expect(onFocus).toHaveBeenCalled()
    })

    it('should handle onBlur', () => {
      const onBlur = vi.fn()
      render(<Input onBlur={onBlur} />)
      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      fireEvent.blur(input)
      expect(onBlur).toHaveBeenCalled()
    })
  })

  describe('Styling', () => {
    it('should have correct base classes', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md')
    })

    it('should have focus ring styles', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus-visible:ring-2')
    })
  })
})
