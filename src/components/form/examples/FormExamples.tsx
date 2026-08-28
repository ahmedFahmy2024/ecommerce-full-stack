"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  CustomCheckbox,
  CustomCheckboxGroup,
  CustomColorPicker,
  CustomCombobox,
  CustomDatePicker,
  CustomDateTimePicker,
  CustomFileUpload,
  CustomInfiniteCombobox,
  CustomInfiniteMultiCombobox,
  CustomInput,
  CustomMultiSelect,
  CustomNumberInput,
  CustomOTPInput,
  CustomPhoneInput,
  CustomRadioGroup,
  CustomRangePicker,
  CustomRichTextEditor,
  CustomSelect,
  CustomSlider,
  CustomSwitch,
  CustomTextarea,
  CustomToggleGroup,
} from "@/components/form";
import type { User } from "@/features/users/types";
import apiClient from "@/services/api";
import { USERS } from "@/services/api/queries";

// ─── Zod schema ────────────────────────────────────────────────────────────────

const formSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  bio: z.string().max(200, "Bio must be at most 200 characters").optional(),
  country: z.string().min(1, "Please select a country"),
  city: z.string().min(1, "Please select a city"),
  userId: z.string().min(1, "Please select a user"),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  role: z.string().min(1, "Please select a role"),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, { message: "You must agree to the terms" }),
  receiveUpdates: z.boolean(),
  startDate: z.date().optional(),
  dateRange: z
    .object({ from: z.date().optional(), to: z.date().optional() })
    .optional(),
  appointmentAt: z.date().optional(),
  attachments: z.array(z.instanceof(File)).optional(),
  richText: z.string().optional(),
  quantity: z.number().min(1).max(100).nullable().optional(),
  rating: z.number().min(0).max(10).optional(),
  userIds: z.array(z.string()).min(1, "Select at least one user"),
  otp: z.string().length(6, "Enter all 6 digits").optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
  viewMode: z.string().min(1, "Please select a view mode").optional(),
  notifications: z.array(z.string()).optional(),
  brandColor: z.string().min(1, "Please pick a color").optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Shared options ─────────────────────────────────────────────────────────────

const countryOptions = [
  { label: "United States", value: "us" },
  { label: "United Kingdom", value: "uk" },
  { label: "Canada", value: "ca" },
  { label: "Australia", value: "au" },
];

const cityOptions = [
  { label: "New York", value: "new-york" },
  { label: "London", value: "london" },
  { label: "Toronto", value: "toronto" },
  { label: "Sydney", value: "sydney" },
];

const roleOptions = [
  { label: "Developer", value: "developer" },
  { label: "Designer", value: "designer" },
  { label: "Manager", value: "manager" },
  { label: "Other", value: "other" },
];

const skillOptions = [
  { label: "TypeScript", value: "typescript" },
  { label: "React", value: "react" },
  { label: "Next.js", value: "nextjs" },
  { label: "Node.js", value: "nodejs" },
  { label: "Tailwind CSS", value: "tailwind" },
];

// ─── Shared infinite query fn for users ────────────────────────────────────────

async function fetchUsers({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search?: string;
}) {
  const res = await apiClient<{
    items: User[];
    meta: { hasNextPage: boolean };
  }>(USERS, {
    query: { page, limit, ...(search ? { search } : {}) },
  });
  return {
    items: res.data.items,
    hasNextPage: res.data.meta.hasNextPage,
  };
}

// ─── Example 1: Full RHF + Zod form ─────────────────────────────────────────────

function RHFFormExample() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      bio: "",
      country: "",
      city: "",
      userId: "",
      skills: [],
      role: "",
      agreeToTerms: false,
      receiveUpdates: false,
      startDate: undefined,
      dateRange: undefined,
      appointmentAt: undefined,
      attachments: [],
      richText: "",
      quantity: null,
      rating: 5,
      userIds: [],
      otp: "",
      phone: "",
      viewMode: "",
      notifications: [],
      brandColor: "#6366f1",
    },
  });

  const watched = watch();

  function onSubmit(data: FormValues) {
    console.log("Form submitted:", data);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex max-w-md flex-col gap-4"
    >
      <h2 className="text-lg font-semibold">Example 1: RHF + Zod</h2>

      <pre className="rounded-md border bg-muted/40 p-2 text-xs">
        attachments:{" "}
        {JSON.stringify(
          (watched.attachments ?? []).map((f) => f.name),
          null,
          2,
        )}
        {"\n"}
        errors:{" "}
        {JSON.stringify(
          Object.fromEntries(
            Object.entries(errors).map(([k, v]) => [k, v?.message]),
          ),
          null,
          2,
        )}
      </pre>

      <CustomInput
        control={control}
        name="fullName"
        label="Full Name"
        placeholder="John Doe"
        required
      />

      <CustomInput
        control={control}
        name="email"
        label="Email"
        type="email"
        placeholder="john@example.com"
        required
      />

      <CustomInput
        control={control}
        name="password"
        label="Password"
        type="password"
        placeholder="Enter password"
        required
        description="Must be at least 8 characters"
      />

      <CustomTextarea
        control={control}
        name="bio"
        label="Bio"
        placeholder="Tell us about yourself..."
        maxLength={200}
        showCount
        rows={3}
      />

      <CustomSelect
        control={control}
        name="country"
        label="Country"
        options={countryOptions}
        placeholder="Select a country"
        required
      />

      <CustomCombobox
        control={control}
        name="city"
        label="City"
        options={cityOptions}
        placeholder="Search city..."
        required
      />

      <CustomInfiniteCombobox<User, FormValues>
        control={control}
        name="userId"
        label="User (infinite scroll)"
        placeholder="Search users..."
        queryKey={["users"]}
        queryFn={fetchUsers}
        getLabel={(u) => u.fullName}
        getValue={(u) => u.id}
        required
      />

      <CustomMultiSelect
        control={control}
        name="skills"
        label="Skills"
        options={skillOptions}
        placeholder="Select skills..."
        required
      />

      <CustomRadioGroup
        control={control}
        name="role"
        label="Role"
        options={roleOptions}
        required
      />

      <CustomCheckbox
        control={control}
        name="agreeToTerms"
        label="I agree to the terms and conditions"
        required
      />

      <CustomSwitch
        control={control}
        name="receiveUpdates"
        label="Receive product updates"
      />

      <CustomDatePicker
        control={control}
        name="startDate"
        label="Start Date"
        placeholder="Pick a start date"
      />

      <CustomRangePicker
        control={control}
        name="dateRange"
        label="Date Range"
        placeholder="Pick a date range"
      />

      <CustomDateTimePicker
        control={control}
        name="appointmentAt"
        label="Appointment"
        placeholder="Pick a date & time"
      />

      <CustomFileUpload
        control={control}
        name="attachments"
        label="Attachments"
        description="JPG, PNG, SVG — 4 MB max per file"
      />

      <CustomRichTextEditor
        control={control}
        name="richText"
        label="Description"
        placeholder="Write a description..."
      />

      <CustomNumberInput
        control={control}
        name="quantity"
        label="Quantity"
        placeholder="Enter quantity"
        min={1}
        max={100}
        step={1}
        required
      />

      <CustomSlider
        control={control}
        name="rating"
        label="Rating"
        min={0}
        max={10}
        step={1}
        formatValue={(v) => `${v}/10`}
        required
      />

      <CustomInfiniteMultiCombobox<User, FormValues>
        control={control}
        name="userIds"
        label="Users (infinite scroll, multi)"
        placeholder="Search users..."
        queryKey={["users-multi"]}
        queryFn={fetchUsers}
        getLabel={(u) => u.fullName}
        getValue={(u) => u.id}
        required
      />

      <CustomPhoneInput
        control={control}
        name="phone"
        label="Phone Number"
        defaultCountry="EG"
      />

      <CustomOTPInput
        control={control}
        name="otp"
        label="Verification Code"
        description="Enter the 6-digit code sent to your phone"
        length={6}
      />

      <CustomToggleGroup
        control={control}
        name="viewMode"
        label="View Mode"
        options={[
          { label: "Grid", value: "grid" },
          { label: "List", value: "list" },
          { label: "Table", value: "table" },
        ]}
      />

      <CustomCheckboxGroup
        control={control}
        name="notifications"
        label="Notifications"
        options={[
          { label: "Email", value: "email" },
          { label: "SMS", value: "sms" },
          { label: "Push", value: "push" },
          { label: "In-app", value: "in-app" },
        ]}
        orientation="horizontal"
      />

      <CustomColorPicker
        control={control}
        name="brandColor"
        label="Brand Color"
        description="Pick a color for your brand"
      />

      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Submit
      </button>
    </form>
  );
}

// ─── Example 2: Controlled usage (no RHF) ───────────────────────────────────────

function ControlledExample() {
  const [inputVal, setInputVal] = useState("");
  const [selectVal, setSelectVal] = useState("");
  const [comboVal, setComboVal] = useState("");
  const [infiniteComboVal, setInfiniteComboVal] = useState("");
  const [textareaVal, setTextareaVal] = useState("");
  const [multiVal, setMultiVal] = useState<string[]>([]);
  const [radioVal, setRadioVal] = useState("");
  const [checkVal, setCheckVal] = useState(false);
  const [switchVal, setSwitchVal] = useState(false);
  const [dateVal, setDateVal] = useState<Date | undefined>(undefined);
  const [rangeVal, setRangeVal] = useState<DateRange | undefined>(undefined);
  const [dateTimeVal, setDateTimeVal] = useState<Date | undefined>(undefined);
  const [filesVal, setFilesVal] = useState<File[]>([]);
  const [richTextVal, setRichTextVal] = useState("");
  const [quantityVal, setQuantityVal] = useState<number | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [userIdsVal, setUserIdsVal] = useState<string[]>([]);
  const [phoneVal, setPhoneVal] = useState("");
  const [otpVal, setOtpVal] = useState("");
  const [viewModeVal, setViewModeVal] = useState("");
  const [notificationsVal, setNotificationsVal] = useState<string[]>([]);
  const [colorVal, setColorVal] = useState("#6366f1");

  return (
    <div className="flex max-w-md flex-col gap-4">
      <h2 className="text-lg font-semibold">Example 2: Controlled (no RHF)</h2>

      <CustomInput
        value={inputVal}
        onChange={setInputVal}
        label="Search"
        placeholder="Type something..."
        description={inputVal ? `You typed: ${inputVal}` : undefined}
      />

      <CustomSelect
        value={selectVal}
        onChange={setSelectVal}
        label="Country"
        options={countryOptions}
        placeholder="Select a country"
      />

      <CustomCombobox
        value={comboVal}
        onChange={setComboVal}
        label="City"
        options={cityOptions}
        placeholder="Search city..."
      />

      <CustomInfiniteCombobox<User>
        value={infiniteComboVal}
        onChange={setInfiniteComboVal}
        label="User (infinite scroll)"
        placeholder="Search users..."
        queryKey={["users-controlled"]}
        queryFn={fetchUsers}
        getLabel={(u) => u.fullName}
        getValue={(u) => u.id}
      />

      <CustomTextarea
        value={textareaVal}
        onChange={setTextareaVal}
        label="Bio"
        placeholder="Tell us about yourself..."
        maxLength={200}
        showCount
        rows={3}
      />

      <CustomMultiSelect
        value={multiVal}
        onChange={setMultiVal}
        label="Skills"
        options={skillOptions}
        placeholder="Select skills..."
      />

      <CustomRadioGroup
        value={radioVal}
        onChange={setRadioVal}
        label="Role"
        options={roleOptions}
      />

      <CustomCheckbox
        value={checkVal}
        onChange={setCheckVal}
        label="I agree to the terms and conditions"
      />

      <CustomSwitch
        value={switchVal}
        onChange={setSwitchVal}
        label="Receive product updates"
      />

      <CustomDatePicker
        value={dateVal}
        onChange={setDateVal}
        label="Start Date"
        placeholder="Pick a start date"
      />

      <CustomRangePicker
        value={rangeVal}
        onChange={setRangeVal}
        label="Date Range"
        placeholder="Pick a date range"
      />

      <CustomDateTimePicker
        value={dateTimeVal}
        onChange={setDateTimeVal}
        label="Appointment"
        placeholder="Pick a date & time"
      />

      <CustomFileUpload
        value={filesVal}
        onChange={setFilesVal}
        label="Attachments"
        description="JPG, PNG, SVG — 4 MB max per file"
      />

      <CustomRichTextEditor
        value={richTextVal}
        onChange={setRichTextVal}
        label="Description"
        placeholder="Write a description..."
      />

      <CustomNumberInput
        value={quantityVal}
        onChange={setQuantityVal}
        label="Quantity"
        placeholder="Enter quantity"
        min={1}
        max={100}
        step={1}
      />

      <CustomSlider
        value={ratingVal}
        onChange={setRatingVal}
        label="Rating"
        min={0}
        max={10}
        step={1}
        formatValue={(v) => `${v}/10`}
      />

      <CustomInfiniteMultiCombobox<User>
        value={userIdsVal}
        onChange={setUserIdsVal}
        label="Users (infinite scroll, multi)"
        placeholder="Search users..."
        queryKey={["users-multi-controlled"]}
        queryFn={fetchUsers}
        getLabel={(u) => u.fullName}
        getValue={(u) => u.id}
      />

      <CustomPhoneInput
        value={phoneVal}
        onChange={setPhoneVal}
        label="Phone Number"
        defaultCountry="EG"
      />

      <CustomOTPInput
        value={otpVal}
        onChange={setOtpVal}
        label="Verification Code"
        description="Enter the 6-digit code"
        length={6}
      />

      <CustomToggleGroup
        value={viewModeVal}
        onChange={setViewModeVal}
        label="View Mode"
        options={[
          { label: "Grid", value: "grid" },
          { label: "List", value: "list" },
          { label: "Table", value: "table" },
        ]}
      />

      <CustomCheckboxGroup
        value={notificationsVal}
        onChange={setNotificationsVal}
        label="Notifications"
        options={[
          { label: "Email", value: "email" },
          { label: "SMS", value: "sms" },
          { label: "Push", value: "push" },
          { label: "In-app", value: "in-app" },
        ]}
        orientation="horizontal"
      />

      <CustomColorPicker
        value={colorVal}
        onChange={setColorVal}
        label="Brand Color"
        description="Pick a color for your brand"
      />

      <div className="rounded-lg border p-3 text-sm text-muted-foreground">
        <p>
          <strong>State:</strong>
        </p>
        <pre className="mt-1 text-xs">
          {JSON.stringify(
            {
              input: inputVal,
              select: selectVal,
              combobox: comboVal,
              infiniteCombobox: infiniteComboVal,
              textarea: textareaVal,
              multiSelect: multiVal,
              radio: radioVal,
              checkbox: checkVal,
              switch: switchVal,
              date: dateVal,
              dateRange: rangeVal,
              dateTime: dateTimeVal,
              files: filesVal.map((f) => f.name),
              richText: richTextVal,
              quantity: quantityVal,
              rating: ratingVal,
              userIds: userIdsVal,
              phone: phoneVal,
              otp: otpVal,
              viewMode: viewModeVal,
              notifications: notificationsVal,
              color: colorVal,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}

// ─── Exported component ─────────────────────────────────────────────────────────

export function FormExamples() {
  return (
    <div className="flex flex-col gap-12 p-8">
      <RHFFormExample />
      <ControlledExample />
    </div>
  );
}
