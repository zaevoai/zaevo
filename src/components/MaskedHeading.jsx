import { Fragment } from 'react'

/* The site's signature headline entrance: each word slides up from behind its
   own line rather than merely fading in. The mask is the wrapper's overflow.

   The geometry is a set — don't move one part without the others. The padding
   is in `em` so it tracks font-size (these headings run 38px to 56px across the
   site); it exists so descenders — the y's in "Privacy Policy" — clear the
   bottom of the mask at rest. `align-bottom` undoes the baseline shift that
   `overflow: hidden` causes on an inline-flex box. And the 130% throw in
   `word-in` is sized to clear that same padding, so a word is fully hidden
   before it starts rather than peeking its tops into the descender gap. */
const MaskedHeading = ({
  as: Tag = 'h1',
  text,
  delay = 0,
  stagger = 70,
  play = true,
  className = '',
  ...rest
}) => {
  const words = text.split(' ')

  return (
    <Tag className={className} {...rest}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="-mb-[0.14em] inline-flex overflow-hidden pb-[0.14em] align-bottom">
            <span
              style={play ? { '--rise-delay': `${delay + index * stagger}ms` } : undefined}
              className={play ? 'word-in' : ''}
            >
              {word}
            </span>
          </span>
          {/* a real space between the masks, so the words still wrap and still
              read as one sentence to a screen reader */}
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  )
}

export default MaskedHeading
