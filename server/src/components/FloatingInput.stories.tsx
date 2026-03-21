import FloatingInput from "./FloatingInput";

export default { title: "FloatingInput" };

export const Default = () => (
  <div className="h-screen bg-zinc-950 flex flex-col">
    <div className="flex-1 p-6">
      <p className="text-sm text-zinc-400">Scroll content goes here...</p>
    </div>
    <FloatingInput onSubmit={(msg) => console.log(msg)} />
  </div>
);
