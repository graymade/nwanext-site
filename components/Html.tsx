// A page body rendered as HTML by lib/render (static at build time). display: contents, so it adds no box.
export default function Html({ html }: { html: string }) {
  return <div className="pg" dangerouslySetInnerHTML={{ __html: html }} />;
}
