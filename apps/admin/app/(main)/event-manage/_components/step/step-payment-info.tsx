/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect } from "react";
import { FieldValues, useFormContext, useWatch } from "react-hook-form";
import { useMutationUploadImage } from "../../../../../../../packages/api/src/mutations/use-mutation-upload-image";
import {
  AddEventFormType,
  BaseSchemaType,
} from "../../../../../hooks/use-add-event-form";
import PaymentCodeField from "../step-payment/payment-code-field";
import PaymentInfoField from "../step-payment/payment-info-field";
import PaymentTicketPriceField from "../step-payment/payment-ticket-price-field";
import StepController from "./step-controller";

interface StepPaymentInfoProps {
  form: AddEventFormType;
  onSubmit: (data: BaseSchemaType) => Promise<void>;
  onPrev: () => void;
  onNext: () => void;
  uketEventImage: FieldValues["uketEventImageId"];
  thumbnailImage: FieldValues["thumbnailImageId"];
  bannerImageList: FieldValues["banners"];
}

export default function StepPaymentInfo({
  form,
  onSubmit,
  onPrev,
  uketEventImage,
  thumbnailImage,
  bannerImageList,
}: StepPaymentInfoProps) {
  const { control, setValue, trigger } = useFormContext();
  const isFree = useWatch({
    control,
    name: "paymentInfo.isFree",
  });
  const isDisabled = isFree === "무료";

  const { mutateAsync } = useMutationUploadImage();

  const handleNext = async () => {
    const isValid = await trigger(
      [
        "paymentInfo.isFree",
        "paymentInfo.ticketPrice",
        "paymentInfo.bankCode",
        "paymentInfo.accountNumber",
        "paymentInfo.depositorName",
        "paymentInfo.depositUrl",
      ],
      {
        shouldFocus: true,
      },
    );

    if (!isValid) return;

    const formData = new FormData();
    formData.append("eventImage", uketEventImage.file!);
    formData.append("thumbnailImage", thumbnailImage.file!);

    bannerImageList.forEach((banner: FieldValues["banners"]) => {
      formData.append("bannerImages", banner.file!);
    });

    await mutateAsync(formData, {
      onSuccess: data => {
        const { uketEventImageId, thumbnailImageId, bannerImageIds } = data;
        const bannerImageIdList = bannerImageIds.split(",");

        setValue("uketEventImageId.id", uketEventImageId);
        setValue("thumbnailImageId.id", thumbnailImageId);
        bannerImageIdList.forEach((bannerImageId: string, index: number) =>
          setValue(`banners.${index}.id`, bannerImageId),
        );

        form.handleSubmit(onSubmit)();
      },
    });
  };

  useEffect(() => {
    if (isFree === "무료") {
      setValue("paymentInfo.ticketPrice", 0);
      setValue("paymentInfo.bankCode", "");
      setValue("paymentInfo.accountNumber", "");
      setValue("paymentInfo.depositorName", "");
      setValue("paymentInfo.depositUrl", "");
    } else {
      setValue("paymentInfo.ticketPrice", 100);
      setValue("paymentInfo.bankCode", undefined);
      setValue("paymentInfo.accountNumber", undefined);
      setValue("paymentInfo.depositorName", undefined);
      setValue("paymentInfo.depositUrl", undefined);
    }
  }, [isFree]);

  return (
    <main className="flex w-full">
      <form
        className="flex w-full flex-col gap-2"
        onSubmit={e => {
          e.preventDefault();
        }}
      >
        <section className="flex w-full bg-white shadow-sm p-11 grow rounded-lg flex-col gap-6">
          <header>
            <h3 className="text-[#17171C] font-bold text-xl">
              4. 입금 정보를 입력해 주세요.
            </h3>
          </header>
          <section className="flex justify-between gap-16">
            <aside className="basis-1/2 flex flex-col gap-4">
              <PaymentTicketPriceField
                control={control}
                onSetValue={setValue}
              />
              <PaymentInfoField control={control} isDisabled={isDisabled} />
            </aside>
            <aside className="flex flex-col gap-4 basis-1/2 pr-32">
              <PaymentCodeField control={control} isDisabled={isDisabled} />
            </aside>
          </section>
        </section>
        <StepController onNext={handleNext} onPrev={onPrev} isLastStep />
      </form>
    </main>
  );
}
