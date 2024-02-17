import React from "react";
import {
  BoltIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Divider,
} from "@nextui-org/react";
import ProductForm from "./product-form";
import ImageCarousel from "./utility-components/image-carousel";
import { ProfileAvatar } from "./utility-components/avatar";
import CompactCategories from "./utility-components/compact-categories";
import { locationAvatar } from "./utility-components/dropdowns/location-dropdown";
import { DisplayCostBreakdown } from "./utility-components/display-monetary-info";
import { SHOPSTRBUTTONCLASSNAMES } from "./utility/STATIC-VARIABLES";
import RequestPassphraseModal from "./utility-components/request-passphrase-modal";
import ConfirmActionDropdown from "./utility-components/dropdowns/confirm-action-dropdown";
import { getLocalStorageData } from "./utility/nostr-helper-functions";

interface ProductModalProps {
  productData: any;
  handleModalToggle: () => void;
  showModal: boolean;
  handleSendMessage: (pubkeyToOpenChatWith: string) => void;
  handleCheckout: (productId: string) => void;
  handleDelete: (productId: string, passphrase?: string) => void;
}

export default function DisplayProductModal({
  productData,
  showModal,
  handleModalToggle,
  handleSendMessage,
  handleReviewAndPurchase,
  handleDelete,
}: ProductModalProps) {
  const {
    pubkey,
    createdAt,
    title,
    images,
    categories,
    location,
    currency,
    totalCost,
  } = productData;
  const { signIn, decryptedNpub } = getLocalStorageData();

  const [requestPassphrase, setRequestPassphrase] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [showProductForm, setShowProductForm] = React.useState(false);

  const displayDate = (timestamp: number): [string, string] => {
    if (timestamp == 0 || !timestamp) return ["", ""];
    const d = new Date(timestamp * 1000);
    const dateString = d.toLocaleString().split(",")[0].trim();
    const timeString = d.toLocaleString().split(",")[1].trim();
    return [dateString, timeString];
  };

  const handleShare = async () => {
    // The content you want to share
    const shareData = {
      title: title,
      url: `${window.location.origin}/listing/${productData.id}`,
    };
    // Check if the Web Share API is available
    if (navigator.share) {
      // Use the share API
      await navigator.share(shareData);
    } else {
      // Fallback for browsers that do not support the Web Share API
      navigator.clipboard.writeText(
        `${window.location.origin}/listing/${productData.id}`,
      );
      alert("Listing URL copied to clipboard!");
    }
  };

  const handleEditToggle = () => {
    setShowProductForm(!showProductForm);
  };

  const beginDeleteListingProcess = () => {
    if (signIn === "extension") {
      finalizeDeleteListingProcess();
    } else if (signIn === "nsec") {
      setRequestPassphrase(true);
    }
  };
  const finalizeDeleteListingProcess = async (passphrase?: string) => {
    // only used for when signIn === "nsec"
    setDeleteLoading(true);
    handleModalToggle(); // closes product detail modal
    await handleDelete(productData.id, passphrase); // delete listing
    setDeleteLoading(false);
  };

  if (!showModal) return null; // needed to prevent TreeWalker error upon redirect while modal open

  return (
    <>
      <Modal
        backdrop="blur"
        isOpen={showModal}
        onClose={handleModalToggle}
        // className="bg-light-fg dark:bg-dark-fg text-black dark:text-white"
        classNames={{
          body: "py-6",
          backdrop: "bg-[#292f46]/50 backdrop-opacity-60",
          header: "border-b-[1px] border-[#292f46]",
          footer: "border-t-[1px] border-[#292f46]",
          closeButton: "hover:bg-black/5 active:bg-white/10",
        }}
        isDismissable={false}
        scrollBehavior={"outside"}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-light-text dark:text-dark-text">
            {title}{" "}
          </ModalHeader>
          <ModalBody className="text-light-text dark:text-dark-text">
            {images ? (
              <ImageCarousel
                images={images}
                showThumbs={images.length > 1}
                classname="max-h-[80vh]"
              />
            ) : null}
            <Divider />
            <div className="flex h-fit w-full flex-row flex-wrap items-center justify-between gap-2">
              <ProfileAvatar pubkey={productData.pubkey} className="w-1/3" />
              <Chip key={location} startContent={locationAvatar(location)}>
                {location}
              </Chip>
              <CompactCategories categories={categories} />
              <div>
                <p className="text-md">{displayDate(createdAt)[0]}</p>
                <p className="text-md">{displayDate(createdAt)[1]}</p>
              </div>
            </div>
            <Divider />
            <div className="overflow-hidden break-words">
              <span className="text-xl font-semibold">Summary: </span>
              {productData.summary}
            </div>
          </ModalBody>

          <ModalFooter>
            <div className="flex w-full flex-wrap justify-evenly gap-2">
              <Button
                type="submit"
                className={SHOPSTRBUTTONCLASSNAMES}
                startContent={
                  <ShareIcon className="h-6 w-6 hover:text-yellow-500" />
                }
                onClick={handleShare}
              >
                Share
              </Button>
              {decryptedNpub === pubkey && (
                <>
                  <Button
                    type="submit"
                    className={SHOPSTRBUTTONCLASSNAMES}
                    startContent={
                      <PencilSquareIcon className="h-6 w-6 hover:text-yellow-500" />
                    }
                    onClick={handleEditToggle}
                    isDisabled={deleteLoading}
                  >
                    Edit Listing
                  </Button>
                  <ConfirmActionDropdown
                    helpText="Are you sure you want to delete this listing?"
                    buttonLabel="Delete Listing"
                    onConfirm={beginDeleteListingProcess}
                  >
                    <Button
                      className="min-w-fit bg-gradient-to-tr from-red-600 via-red-500 to-red-600 text-white shadow-lg"
                      startContent={
                        <TrashIcon className="h-6 w-6 hover:text-yellow-500" />
                      }
                      isDisabled={deleteLoading}
                      isLoading={deleteLoading}
                    >
                      Delete Listing
                    </Button>
                  </ConfirmActionDropdown>
                </>
              )}
              {decryptedNpub !== pubkey && (
                <>
                  <Button
                    onClick={() => {
                      handleSendMessage(productData.pubkey);
                    }}
                    type="submit"
                    className={SHOPSTRBUTTONCLASSNAMES}
                    startContent={
                      <EnvelopeIcon className="h-6 w-6 hover:text-yellow-500" />
                    }
                  >
                    Message
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => handleReviewAndPurchase(productData.id)}
                    className={SHOPSTRBUTTONCLASSNAMES}
                    startContent={
                      <BoltIcon className="h-6 w-6 hover:text-yellow-500" />
                    }
                  >
                    Review & Purchase
                  </Button>
                </>
              )}
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <RequestPassphraseModal
        isOpen={requestPassphrase}
        setIsOpen={setRequestPassphrase}
        actionOnSubmit={finalizeDeleteListingProcess}
      />
      {decryptedNpub === pubkey && (
        <ProductForm
          showModal={showProductForm}
          handleModalToggle={handleEditToggle}
          oldValues={productData}
          handleDelete={handleDelete}
          onSubmitCallback={handleModalToggle}
        />
      )}
    </>
  );
}
