import { useEffect, useState } from "react";
import { getCachedImageUrl, peekCachedImageUrl } from "../lib/imageCache";

type CachedImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src: string;
};

// Drop-in <img> replacement backed by the Cache Storage API (see imageCache.ts).
// Object URLs are owned by imageCache's in-memory map, not this component, so a
// remount for a source already resolved this session (e.g. paginating back to a
// previously-seen page) paints it immediately instead of re-resolving async.
const CachedImage = ({ src, ...rest }: CachedImageProps) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() =>
    peekCachedImageUrl(src),
  );

  useEffect(() => {
    const known = peekCachedImageUrl(src);
    if (known) {
      setResolvedSrc(known);
      return;
    }

    let cancelled = false;
    getCachedImageUrl(src).then((url) => {
      if (!cancelled) setResolvedSrc(url);
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return <img src={resolvedSrc ?? undefined} {...rest} />;
};

export default CachedImage;
