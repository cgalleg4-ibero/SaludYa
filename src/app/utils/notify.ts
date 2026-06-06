import Swal from 'sweetalert2';

export const success = (title: string, text?: string) => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title,
    text,
    showConfirmButton: false,
    timer: 2000
  });
};

export const error = (title: string, text?: string) => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'error',
    title,
    text,
    showConfirmButton: false,
    timer: 3000
  });
};

export const confirm = async (title: string, text?: string) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No'
  });
  return result.isConfirmed;
};

export const promptPassword = async (title: string, placeholder = ''): Promise<string | null> => {
  const result = await Swal.fire({
    title,
    input: 'password',
    inputPlaceholder: placeholder,
    showCancelButton: true
  });
  if (result.isConfirmed) return result.value as string;
  return null;
};
