import React from 'react'

const Skeleton = ({ width, height, className = '', style = {} }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? '16px',
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

// Composite skeleton card for loading states
export const SkeletonCard = () => (
  <div className="card space-y-3">
    <Skeleton height="20px" width="60%" />
    <Skeleton height="14px" />
    <Skeleton height="14px" width="80%" />
    <div className="flex gap-2 pt-1">
      <Skeleton height="28px" width="80px" style={{ borderRadius: '9999px' }} />
      <Skeleton height="28px" width="80px" style={{ borderRadius: '9999px' }} />
    </div>
  </div>
)

export default Skeleton
