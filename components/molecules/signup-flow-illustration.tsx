import Image from "next/image";

import illustration from "@/app/assets/image.svg";

/** Decorative art for sign-up / register split layouts (`app/assets/image.svg`). */
export function SignupFlowIllustration() {
  return (
    <div className="flex h-full min-h-[min(50vh,24rem)] w-full flex-1 items-center justify-center p-6 lg:min-h-0 lg:p-10">
      <Image
        src={illustration}
        alt=""
        width={616}
        height={401}
        priority
        unoptimized
        className="h-auto max-h-[min(78vh,560px)] w-auto max-w-[min(90%,520px)] object-contain"
      />
    </div>
  );
}
