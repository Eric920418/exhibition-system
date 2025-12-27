import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with children', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('should render as button by default', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should forward ref correctly', () => {
      const ref = vi.fn()
      render(<Button ref={ref}>Button</Button>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Destructive</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border')
    })

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary')
    })

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent')
    })

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('underline-offset-4')
    })
  })

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button>Default Size</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-4', 'py-2')
    })

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-3')
    })

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11', 'px-8')
    })

    it('should render icon size', () => {
      render(<Button size="icon">Icon</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'w-10')
    })
  })

  describe('Interactions', () => {
    it('should handle click events', () => {
      const onClick = vi.fn()
      render(<Button onClick={onClick}>Click</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should not fire click when disabled', () => {
      const onClick = vi.fn()
      render(<Button disabled onClick={onClick}>Disabled</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(onClick).not.toHaveBeenCalled()
    })

    it('should apply disabled styles', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
    })
  })

  describe('Custom className', () => {
    it('should merge custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('AsChild prop', () => {
    it('should render as slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/link">Link Button</a>
        </Button>
      )
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/link')
    })
  })

  describe('HTML attributes', () => {
    it('should pass type attribute', () => {
      render(<Button type="submit">Submit</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('should pass aria attributes', () => {
      render(<Button aria-label="Close dialog">X</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog')
    })
  })
})
