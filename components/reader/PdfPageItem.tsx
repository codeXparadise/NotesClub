"use client";

import React, { useEffect, useRef, useState } from "react";
import { Watermark } from "./Watermark";

interface PdfPageItemProps {
  pageNumber: number;
  pdfDoc: any;
  scale: number;
  toneFilterClass: string;
  showWatermark: boolean;
  studentName: string;
  rollNumber: string | null;
  email: string;
  containerWidth: number;
  onPageVisible?: (pageNumber: number) => void;
  onLinkClick?: (pageNumber: number) => void;
}

export const PdfPageItem: React.FC<PdfPageItemProps> = ({
  pageNumber,
  pdfDoc,
  scale,
  toneFilterClass,
  showWatermark,
  studentName,
  rollNumber,
  email,
  containerWidth,
  onPageVisible,
  onLinkClick,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [isRendered, setIsRendered] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 800,
  });

  // 1. Initial dimensions calculation to reserve space and prevent scrollbar jumping
  useEffect(() => {
    let active = true;
    if (pdfDoc) {
      pdfDoc.getPage(pageNumber).then((page: any) => {
        if (!active) return;
        const baseViewport = page.getViewport({ scale: 1 });
        let fitScale = 1.0;
        const availableWidth = containerWidth > 0 ? containerWidth : window.innerWidth;
        if (availableWidth < 768) {
          fitScale = Math.min((availableWidth - 24) / baseViewport.width, 1.25);
        } else {
          fitScale = Math.min((availableWidth - 48) / baseViewport.width, 1.4);
        }
        const effectiveScale = fitScale * scale;
        const vp = page.getViewport({ scale: effectiveScale });
        setDimensions({
          width: Math.floor(vp.width),
          height: Math.floor(vp.height),
        });
      }).catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [pdfDoc, pageNumber, containerWidth, scale]);

  // 2. High-performance Page Rendering (Canvas + TextLayer + AnnotationLayer)
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const baseViewport = page.getViewport({ scale: 1 });
        let fitScale = 1.0;
        const availableWidth = containerWidth > 0 ? containerWidth : window.innerWidth;
        if (availableWidth < 768) {
          fitScale = Math.min((availableWidth - 24) / baseViewport.width, 1.25);
        } else {
          fitScale = Math.min((availableWidth - 48) / baseViewport.width, 1.4);
        }
        const effectiveScale = fitScale * scale;
        const viewport = page.getViewport({ scale: effectiveScale });

        const pixelRatio = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(viewport.width);
        const displayHeight = Math.floor(viewport.height);

        canvas.width = Math.floor(displayWidth * pixelRatio);
        canvas.height = Math.floor(displayHeight * pixelRatio);
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        setDimensions({ width: displayWidth, height: displayHeight });

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
        if (isCancelled) return;

        setIsRendered(true);

        // Render Text Layer for Text Selection and Copying
        const textLayerDiv = textLayerRef.current;
        if (textLayerDiv) {
          textLayerDiv.innerHTML = "";
          textLayerDiv.style.width = `${displayWidth}px`;
          textLayerDiv.style.height = `${displayHeight}px`;

          // Modern PDF.js (v3 & v4) requires --scale-factor CSS variable on the text container
          const scaleFactorStr = `${viewport.scale}`;
          textLayerDiv.style.setProperty("--scale-factor", scaleFactorStr);
          if (wrapperRef.current) {
            wrapperRef.current.style.setProperty("--scale-factor", scaleFactorStr);
          }

          const pdfjs = (window as any).pdfjsLib;
          if (pdfjs && typeof pdfjs.renderTextLayer === "function") {
            try {
              const textContent = await page.getTextContent();
              if (!isCancelled) {
                const textTask = pdfjs.renderTextLayer({
                  textContentSource: textContent,
                  container: textLayerDiv,
                  viewport,
                  textDivs: [],
                });
                if (textTask && textTask.promise) {
                  await textTask.promise;
                }
              }
            } catch (textErr: any) {
              if (textErr?.name !== "RenderingCancelledException") {
                console.warn("Text layer render warning:", textErr);
              }
            }
          }
        }

        // Render Annotation Layer for Clickable Links inside document
        const annotLayerDiv = annotationLayerRef.current;
        if (annotLayerDiv) {
          annotLayerDiv.innerHTML = "";
          annotLayerDiv.style.width = `${displayWidth}px`;
          annotLayerDiv.style.height = `${displayHeight}px`;

          const pdfjs = (window as any).pdfjsLib;
          if (pdfjs && pdfjs.AnnotationLayer) {
            try {
              const annotations = await page.getAnnotations({ intent: "display" });
              if (!isCancelled && annotations && annotations.length > 0) {
                pdfjs.AnnotationLayer.render({
                  viewport: viewport.clone({ dontFlip: true }),
                  div: annotLayerDiv,
                  annotations,
                  page,
                  linkService: {
                    getDestinationHash: () => "#",
                    getAnchorUrl: () => "#",
                    setHash: () => {},
                    addLinkAttributes: (link: HTMLAnchorElement, url: string) => {
                      link.href = url;
                      link.target = "_blank";
                      link.rel = "noopener noreferrer";
                    },
                    goToDestination: (dest: any) => {
                      if (typeof dest === "string") {
                        pdfDoc.getDestination(dest).then((explicitDest: any) => {
                          if (explicitDest && explicitDest[0]) {
                            pdfDoc.getPageIndex(explicitDest[0]).then((pgIdx: number) => {
                              onLinkClick?.(pgIdx + 1);
                            });
                          }
                        });
                      } else if (Array.isArray(dest) && dest[0]) {
                        pdfDoc.getPageIndex(dest[0]).then((pgIdx: number) => {
                          onLinkClick?.(pgIdx + 1);
                        });
                      }
                    },
                  },
                });
              }
            } catch (annotErr) {
              console.warn("Annotation layer render warning:", annotErr);
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Page ${pageNumber} render error:`, err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, containerWidth, scale, onLinkClick]);

  // 3. Intersection Observer to track active page for navigation bar and auto-resume
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !onPageVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            onPageVisible(pageNumber);
          }
        }
      },
      {
        threshold: [0.1, 0.45, 0.8],
        rootMargin: "0px 0px -20% 0px",
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [pageNumber, onPageVisible]);

  return (
    <div
      ref={wrapperRef}
      id={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      className="relative mb-6 mx-auto rounded shadow-2xl transition-all duration-75 select-text overflow-hidden bg-white"
      style={{
        width: `${dimensions.width}px`,
        minHeight: `${dimensions.height}px`,
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.75)",
      }}
    >
      {/* 1. Underlying Canvas Layer */}
      <canvas
        ref={canvasRef}
        className={`block rounded-sm transition-all duration-75 ${toneFilterClass}`}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      />

      {/* 2. Text Layer for exact text selection and copying */}
      <div
        ref={textLayerRef}
        className="textLayer"
        style={
          {
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            "--scale-factor": `${scale}`,
          } as React.CSSProperties
        }
      />

      {/* 3. Annotation Layer for clickable links */}
      <div
        ref={annotationLayerRef}
        className="annotationLayer"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      />

      {/* 4. Dynamic Watermark */}
      {showWatermark && (
        <Watermark
          studentName={studentName}
          rollNumber={rollNumber}
          email={email}
          page={pageNumber}
        />
      )}

      {/* 5. Subtle Page Number Badge */}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-zinc-300 pointer-events-none select-none z-10">
        Page {pageNumber}
      </div>
    </div>
  );
};
